/**
 * Extracts the last JSON object from a Task-subagent transcript JSONL file.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const mappingPath = process.argv[2];
const outDir = process.argv[3];
if (!mappingPath || !outDir) {
  console.error("Usage: tsx scripts/collect-agent-eval-outputs.ts <mapping.json> <out-condition-dir>");
  process.exit(1);
}

const mapping = JSON.parse(readFileSync(mappingPath, "utf8")) as Record<string, string>;
mkdirSync(outDir, { recursive: true });

function extractJson(text: string): string | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return null;
}

for (const [caseId, transcriptPath] of Object.entries(mapping)) {
  const raw = readFileSync(transcriptPath, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  let best: string | null = null;
  for (const line of lines) {
    try {
      const event = JSON.parse(line) as { role?: string; message?: { content?: unknown } };
      const content = event.message?.content;
      let text = "";
      if (typeof content === "string") text = content;
      else if (Array.isArray(content)) {
        text = content
          .map((part) => {
            if (typeof part === "string") return part;
            if (part && typeof part === "object" && "text" in part) {
              return String((part as { text: unknown }).text);
            }
            return "";
          })
          .join("\n");
      }
      const extracted = extractJson(text);
      if (extracted) best = extracted;
    } catch {
      // ignore non-jsonl noise
    }
  }
  const outPath = join(outDir, `${caseId}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  if (!best) {
    writeFileSync(outPath, `${JSON.stringify({ raw: "MALFORMED: no JSON found in transcript" }, null, 2)}\n`);
    console.error(`WARN: no JSON for ${caseId}`);
  } else {
    // Store as { raw: "<json text>" } so score-agent-eval can read it.
    writeFileSync(outPath, `${JSON.stringify({ raw: best }, null, 2)}\n`);
    console.log(`wrote ${caseId}`);
  }
}
