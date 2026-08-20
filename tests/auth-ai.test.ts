import { describe, expect, it } from "vitest";
import {
  decodeGuestPayload,
  encodeGuestPayload,
  guestExpiryDate,
  isGuestExpired,
} from "@/lib/auth/guest";
import { canAccessOwnedRecord } from "@/lib/auth/owner";
import { isOwnedAndActive } from "@/lib/db/queries";
import { FeedbackReportSchema, ProgressAnswerSchema } from "@/lib/ai/schemas";

describe("guest expiry", () => {
  it("signs and verifies a guest cookie", () => {
    const exp = Date.now() + 60_000;
    const signed = encodeGuestPayload({ id: "guest_abc", exp }, "secret");
    expect(decodeGuestPayload(signed, "secret", Date.now())?.id).toBe("guest_abc");
  });

  it("rejects expired guests", () => {
    expect(isGuestExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(guestExpiryDate().getTime()).toBeGreaterThan(Date.now());
  });
});

describe("owner isolation", () => {
  it("allows only matching owners", () => {
    expect(canAccessOwnedRecord("user_1", "user_1")).toBe(true);
    expect(canAccessOwnedRecord("user_1", "user_2")).toBe(false);
  });

  it("hides expired guest records from another owner", () => {
    const record = {
      ownerId: "guest_1",
      expiresAt: new Date(Date.now() - 1000),
    };
    expect(isOwnedAndActive(record, "guest_1")).toBe(false);
    expect(isOwnedAndActive({ ownerId: "user_1", expiresAt: null }, "user_1")).toBe(true);
  });
});

describe("AI structured output schemas", () => {
  it("requires transcript evidence on feedback dimensions", () => {
    expect(() =>
      FeedbackReportSchema.parse({
        overallScore: 8,
        dimensionScores: [{ dimension: "clarity", score: 8, evidence: "short" }],
        strengths: ["good"],
        improvementActions: ["fix"],
        nextPracticeRecommendation: "more",
      }),
    ).toThrow();
  });

  it("accepts a valid feedback report", () => {
    const report = FeedbackReportSchema.parse({
      overallScore: 7.2,
      dimensionScores: [
        {
          dimension: "clarity",
          score: 7,
          evidence: "The candidate explained the Python pipeline in order.",
        },
      ],
      strengths: ["Clear project walkthrough with a concrete metric."],
      improvementActions: ["Add a result metric to the data quality example."],
      nextPracticeRecommendation: "Practice a structured evaluation-set design answer.",
    });
    expect(report.dimensionScores[0]?.evidence.length).toBeGreaterThan(12);
  });

  it("requires the progress assistant to cite metric keys", () => {
    const answer = ProgressAnswerSchema.parse({
      answer: "Average score rose from 6.1 to 7.4.",
      usedMetricKeys: ["averageScore"],
      recommendation: "Practice warmth and concise structure next.",
    });
    expect(answer.usedMetricKeys).toContain("averageScore");
  });
});
