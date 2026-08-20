"use client";

import { useEffect, useRef, useState } from "react";
import type { RemoteTrack } from "livekit-client";

export function useAudioAmplitude(track?: RemoteTrack) {
  const [amplitude, setAmplitude] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (!track || track.kind !== "audio") {
      return;
    }

    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const source = context.createMediaStreamSource(mediaStream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const value of data) {
        const normalized = (value - 128) / 128;
        sum += normalized * normalized;
      }
      setAmplitude(Math.min(1, Math.sqrt(sum / data.length) * 4));
      frame.current = window.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.cancelAnimationFrame(frame.current);
      void context.close();
    };
  }, [track]);

  return track?.kind === "audio" ? amplitude : 0;
}
