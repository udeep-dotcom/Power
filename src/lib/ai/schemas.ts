import { z } from "zod";

export const FieldDataTypeSchema = z.enum([
  "TEXT",
  "DATE",
  "CURRENCY",
  "NUMBER",
  "ACCOUNT",
  "SWIFT",
  "CHECKBOX",
]);

export const DetectedFormFieldSchema = z.object({
  fieldKey: z
    .string()
    .describe("snake_case semantic key for what this field represents, e.g. beneficiary_name"),
  label: z.string().describe("the label text as it appears on the form"),
  anchorText: z
    .string()
    .describe(
      "the exact, verbatim substring of the label text as it appears in the provided document text, used to locate its position",
    ),
  page: z.number().int().min(1),
  placement: z.enum(["right", "below"]).describe(
    "where the value should be written relative to the label: 'right' for label/value on the same line, 'below' for the value on the line underneath the label",
  ),
  dataType: FieldDataTypeSchema,
  required: z.boolean(),
});

export const FormFieldDetectionSchema = z.object({
  // No .max() here: some structured-output backends (e.g. Gemini via
  // OpenRouter) compile `maxItems` on an array of a multi-property nested
  // object into a constrained-decoding grammar whose state count blows up
  // ("schema produces a constraint that has too many states for serving").
  // A form having over a hundred fields is implausible anyway, so nothing
  // downstream needs this enforced at the schema level.
  fields: z.array(DetectedFormFieldSchema),
});

export const FieldAssignmentSchema = z.object({
  formFieldKey: z.string().describe("the key of the blank form field being filled"),
  sourceFieldKey: z
    .string()
    .describe(
      "the key of the extracted document value this is taken from; must be one of the supplied candidates, never invented",
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("how sure you are this source value belongs in this form field"),
  reason: z.string().describe("one short sentence justifying the assignment"),
});

export const FieldReconciliationSchema = z.object({
  assignments: z.array(FieldAssignmentSchema),
});

export const ExtractedFieldSchema = z.object({
  fieldKey: z.string().describe("snake_case semantic key matching the shared field vocabulary where possible"),
  value: z.string(),
  sourceText: z.string().describe("the verbatim snippet of document text this value was read from"),
  sourcePage: z.number().int().min(1).nullable(),
  confidence: z.number().min(0).max(1),
});

export const DocumentExtractionSchema = z.object({
  documentGroup: z
    .enum(["supplier", "bank", "invoice", "buyer", "shipment", "insurance", "payment", "other"])
    .describe("the logical group this document mainly belongs to"),
  // See the comment on FormFieldDetectionSchema.fields — no .max() for the
  // same reason (Gemini structured-output grammar state blowup).
  fields: z.array(ExtractedFieldSchema),
});
