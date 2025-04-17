import type { MaxChunkLengthCallback } from "./MaxChunkLengthCallback.js";

/** @internal Data representing the current chunk process. */
export type ChunkData = {
	/** all the chunks created */
	chunks: string[];

	/** the chunk currently being processed */
	currentChunk?: string;

	/** the index of the chunk currently being processed */
	currentIndex: number;

	/** the callback to determing the maxChunkLength */
	maxChunkLength: MaxChunkLengthCallback;
};