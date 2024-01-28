import type { MaxChunkLengthCallback } from "./MaxChunkLengthCallback.js";

/** Options for how to split the text when creating chunks. */
export type ChunkOptions = {
	/** used to split lines; default "\n" */
	lineSplitter: string | RegExp;
	/** how long a chunk should be */
	maxChunkLength: number | MaxChunkLengthCallback;
	/** used to join lines; default "\n" */
	newLineCharacter: string;
	/** used to join words; default " " */
	spaceCharacter: string;
	/** used to split words; default " " */
	wordSplitter: string | RegExp;
};