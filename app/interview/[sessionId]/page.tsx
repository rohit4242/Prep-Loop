"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InterviewRoom } from "@/components/interview/room";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Payload = {
  scenario?: { title?: string };
  connection?: {
    serverUrl: string;
    participantToken: string;
    mock: boolean;
  };
  error?: string;
};

export default function InterviewPage() {
  const params = useParams<{ sessionId: string }>();
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    void fetch(`/api/sessions/${params.sessionId}`)
      .then((response) => response.json())
      .then(setData);
  }, [params.sessionId]);

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Alert>
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <InterviewRoom
        sessionId={params.sessionId}
        serverUrl={data.connection?.serverUrl ?? ""}
        participantToken={data.connection?.participantToken ?? ""}
        mock={data.connection?.mock}
        personaLabel={data.scenario?.title ?? "Technical Interviewer"}
      />
    </div>
  );
}
