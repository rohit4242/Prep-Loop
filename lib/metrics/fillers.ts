import { FILLER_WORDS } from "@/lib/constants";

const FILLER_PATTERN = new RegExp(
  `\\b(${FILLER_WORDS.map((word) => word.replace(" ", "\\s+")).join("|")})\\b`,
  "gi",
);

export function countFillerWords(text: string): number {
  return (text.match(FILLER_PATTERN) ?? []).length;
}

export function fillerWordRate(text: string): number {
  const words = countWords(text);
  if (words === 0) return 0;
  return Number((countFillerWords(text) / words).toFixed(4));
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function wordsPerMinute(wordCount: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return Number(((wordCount / durationMs) * 60_000).toFixed(2));
}

export function normalizeScore(value: number, min = 0, max = 10): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Number(value.toFixed(2))));
}
