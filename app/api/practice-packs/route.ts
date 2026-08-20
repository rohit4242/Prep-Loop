import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSignedInOwner } from "@/lib/auth/owner";
import { guestExpiryDate } from "@/lib/auth/guest";
import { getDb } from "@/lib/db";
import { practicePacks, scenarios } from "@/lib/db/schema";
import { generatePracticePack, generateScenario } from "@/lib/ai/generate";
import { extractPdfText } from "@/lib/ai/extract-pdf";
import { createId } from "@/lib/id";
import { desc, eq } from "drizzle-orm";

const jsonSchema = z.object({
  targetRole: z.string().min(3),
  sourceText: z.string().min(20).optional(),
  sourceType: z.enum(["paste", "pdf"]).default("paste"),
});

export async function GET() {
  try {
    const owner = await requireSignedInOwner();
    const db = getDb();
    const packs = await db
      .select()
      .from(practicePacks)
      .where(eq(practicePacks.ownerId, owner.ownerId))
      .orderBy(desc(practicePacks.createdAt));
    return NextResponse.json({ packs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list packs";
    const status = message === "SIGN_IN_REQUIRED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireSignedInOwner();
    const contentType = request.headers.get("content-type") ?? "";
    let targetRole = "";
    let sourceText = "";
    let sourceType: "paste" | "pdf" = "paste";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      targetRole = String(form.get("targetRole") ?? "");
      const file = form.get("file");
      if (file instanceof File) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        sourceText = await extractPdfText(bytes);
        sourceType = "pdf";
      }
    } else {
      const parsed = jsonSchema.parse(await request.json());
      targetRole = parsed.targetRole;
      sourceText = parsed.sourceText ?? "";
      sourceType = parsed.sourceType;
    }

    if (!sourceText || sourceText.length < 20) {
      return NextResponse.json({ error: "Source text is too short." }, { status: 400 });
    }

    const packOutput = await generatePracticePack({ targetRole, sourceText, sourceType });
    const scenarioOutput = await generateScenario({
      targetRole: packOutput.targetRole,
      sourceText,
    });

    const db = getDb();
    const packId = createId("pack");
    const scenarioId = createId("scenario");
    const expiresAt = owner.isGuest ? guestExpiryDate() : null;

    await db.insert(practicePacks).values({
      id: packId,
      ownerId: owner.ownerId,
      title: packOutput.title,
      targetRole: packOutput.targetRole,
      sourceText,
      sourceType,
      expiresAt,
    });
    await db.insert(scenarios).values({
      id: scenarioId,
      practicePackId: packId,
      ...scenarioOutput,
    });

    return NextResponse.json({ packId, scenarioId, pack: packOutput, scenario: scenarioOutput });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create pack";
    const status = message === "SIGN_IN_REQUIRED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
