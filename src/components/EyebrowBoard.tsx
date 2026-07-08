import { SparklesText } from "./ui/sparkles-text";

export default function EyebrowBoard() {
  return (
    <span className="text-xs font-medium tracking-[0.04em] text-[var(--fg-muted)]">
      MADE WITH LOVE IN{" "}
      <SparklesText
        className="inline text-xs font-medium tracking-[0.04em] text-[var(--fg-muted)]"
        colors={{ first: "#10b981", second: "#6ee7b7" }}
        sparklesCount={6}
      >
        MELBOURNE
      </SparklesText>
    </span>
  );
}
