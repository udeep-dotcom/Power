// pdfjs-dist ships the worker build without type declarations. It's imported
// only for its side effect of being registered as `globalThis.pdfjsWorker`
// (see extractText.ts), so an opaque module type is all that's needed.
declare module "pdfjs-dist/legacy/build/pdf.worker.mjs" {
  const workerModule: unknown;
  export = workerModule;
}
