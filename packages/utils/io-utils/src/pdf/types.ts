import type { PageJson } from "./internal/types.js";

/** Represents the JSON extracted from a PDF. */
export type PdfJson = { Pages:PageJson[]; Meta?:{ Title?:string; }; };
