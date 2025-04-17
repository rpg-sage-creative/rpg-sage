import type { ChunkData } from "./ChunkData.js";
import type { ChunkOptions } from "./ChunkOptions.js";

/** @internal Creates a new chunk if adding the word would cause the current chunk to become too long. */
export function chunkWord(data: ChunkData, options: ChunkOptions, word: string, wordIndex: number): void {
	// Treat undefined as empty string for length and concatenation
	const currentChunk = data.currentChunk ?? "";

	// We don't want a leading space
	const space = 0 < wordIndex ? options.spaceCharacter : "";

	// Test if the word would put the chunk over the maxChunkLength
	if (currentChunk.length + space.length + word.length < data.maxChunkLength(data.currentIndex)) {
		// If not, simply add it, including the space since we split on that
		data.currentChunk = currentChunk + space + word;

	}else {
		// We know we are too long, so we push the current chunk and start a new one
		if (data.currentChunk !== undefined) {
			// Push the current chunk and save the new index
			data.currentIndex = data.chunks.push(data.currentChunk);
		}
		// If we are at index -1, set it to 0 ... otherwise keep our index
		data.currentIndex = Math.max(data.currentIndex, 0);


		// Start the new chunk with the current word
		data.currentChunk = space + word;
	}
}
