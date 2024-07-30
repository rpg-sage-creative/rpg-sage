import type { PageJson } from "./internal/types.js";

/** Represents the JSON extracted from a PDF. */
export type PdfJson = {
	Meta?: {
		Title?: string;
	};
	Pages: PageJson[];
};
