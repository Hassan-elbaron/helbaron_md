// Word (.docx) conversion lives behind its own entry point so the large
// converter libraries load only when a user imports or exports a Word file.
export * from "./docx-export.ts";
export * from "./docx-import.ts";
