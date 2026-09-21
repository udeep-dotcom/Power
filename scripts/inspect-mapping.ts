/**
 * Diagnoses why a form didn't get filled, without going through the UI.
 *
 * Runs the real pipeline steps against local files and reports the thing that
 * actually determines whether anything maps: the field keys each side produced
 * and how many of them overlap. A form that "reaches review" with every value
 * blank is almost always an empty intersection here.
 *
 *   npx tsx scripts/inspect-mapping.ts --form samples/connectips.pdf \
 *                                      --doc samples/pi.pdf --doc samples/policy.pdf
 *
 * Makes real, billed AI calls (roughly $0.01 per run on gemini-2.5-flash).
 * Pass --dry to stop after the text-quality check and skip the AI entirely.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { extractPdfLayout, layoutToPlainText } from "../src/lib/pdf/extractText";
import { assessTextQuality, isLikelyGarbledText } from "../src/lib/pdf/textQuality";
import { analyzeBlankForm } from "../src/lib/pdf/analyzeForm";
import { extractFromText } from "../src/lib/pdf/extractDocument";
import { reconcileFieldValues } from "../src/lib/pdf/reconcileFields";
import { getAIProvider } from "../src/lib/ai/provider";

function parseArgs(argv: string[]) {
  const form = argv[argv.indexOf("--form") + 1];
  const docs: string[] = [];
  argv.forEach((arg, i) => {
    if (arg === "--doc") docs.push(argv[i + 1]);
  });
  return { form: argv.includes("--form") ? form : undefined, docs, dry: argv.includes("--dry") };
}

async function readAndCheck(path: string, label: string) {
  const layout = await extractPdfLayout(readFileSync(path));
  const text = layoutToPlainText(layout);
  const quality = assessTextQuality(text);
  const garbled = isLikelyGarbledText(quality);

  console.log(`\n${label}: ${path}`);
  console.log(`  pages=${layout.length} tokens=${quality.wordTokenCount} ` +
    `malformed=${quality.malformedRatio.toFixed(4)} ${garbled ? "REJECTED (garbled)" : "accepted"}`);
  if (garbled) console.log(`  examples: ${quality.examples.join(", ")}`);

  return { text, garbled };
}

async function main() {
  const { form, docs, dry } = parseArgs(process.argv);
  if (!form && docs.length === 0) {
    console.error("Usage: npx tsx scripts/inspect-mapping.ts --form <pdf> [--doc <pdf>...] [--dry]");
    process.exit(1);
  }

  const formFields: { fieldKey: string; label: string; dataType: string }[] = [];
  const candidates: { fieldKey: string; value: string }[] = [];

  if (form) {
    const { garbled } = await readAndCheck(form, "BLANK FORM");
    if (!garbled && !dry) {
      const result = await analyzeBlankForm(await extractPdfLayout(readFileSync(form)), getAIProvider());
      formFields.push(...result.fields);
      const distinct = new Set(result.fields.map((f) => f.fieldKey)).size;
      console.log(`  ${distinct} distinct fields across ${result.fields.length} printed placements` +
        `, ${result.unresolved.length} unresolved`);

      // More placements than copies of the form means an anchor matched text
      // it doesn't own, which would write a value into the wrong box.
      const counts = new Map<string, number>();
      for (const f of result.fields) counts.set(f.fieldKey, (counts.get(f.fieldKey) ?? 0) + 1);
      const suspicious = [...counts.entries()].filter(([, n]) => n > 2);
      if (suspicious.length > 0) {
        console.log(`  OVER-MATCHED (>2 placements): ` +
          suspicious.map(([k, n]) => `${k}×${n}`).join(", "));
      }
      if (result.unresolved.length > 0) {
        console.log(`  unresolved: ${result.unresolved.map((u) => u.fieldKey).join(", ")}`);
      }
    }
  }

  for (const doc of docs) {
    const { text, garbled } = await readAndCheck(doc, "SUPPORTING DOC");
    if (!garbled && !dry) {
      const result = await extractFromText(text, getAIProvider());
      candidates.push(...result.candidates);
      console.log(`  group=${result.documentGroup}, extracted ${result.candidates.length} values`);
    }
  }

  if (dry || formFields.length === 0 || candidates.length === 0) return;

  const uniqueFields = [...new Map(formFields.map((f) => [f.fieldKey, f])).values()];
  const uniqueCandidates = [...new Map(candidates.map((c) => [c.fieldKey, c])).values()];

  const result = await reconcileFieldValues(
    uniqueFields.map((f) => ({ fieldKey: f.fieldKey, label: f.label, dataType: f.dataType })),
    uniqueCandidates.map((c) => ({ fieldKey: c.fieldKey, value: c.value })),
    getAIProvider(),
  );

  const valueByKey = new Map(uniqueCandidates.map((c) => [c.fieldKey, c.value]));

  console.log(`\n=== RECONCILIATION ===`);
  console.log(`${result.assignments.length} of ${uniqueFields.length} distinct form fields assigned\n`);
  for (const a of result.assignments) {
    console.log(`  ${a.formFieldKey}`);
    console.log(`    = ${JSON.stringify(valueByKey.get(a.sourceFieldKey))}`);
    console.log(`    from ${a.sourceFieldKey} (confidence ${a.confidence}) — ${a.reason}`);
  }

  const unassigned = uniqueFields.filter(
    (f) => !result.assignments.some((a) => a.formFieldKey === f.fieldKey),
  );
  console.log(`\n  left for the human (${unassigned.length}): ${unassigned.map((f) => f.fieldKey).join(", ")}`);
  if (result.rejected.length > 0) {
    console.log(`\n  REJECTED (invented keys): ${JSON.stringify(result.rejected)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
