import { codeBlockSafeSplit } from "../codeBlocks/codeBlockSafeSplit.js";
import { chunkLine } from "./chunkLine.js";
import type { ChunkData, ChunkOptions } from "./types.js";

/**
 * Splits input into chunks ensuring that no "chunk" is greater than maxChunkLength (if given).
 * Default options: lineSplitter (default "\n"), wordSplitter (default " ")
 */
export function chunk(input: string, options?: ChunkOptions): string[] {
	// don't waste any time on an empty/undefined string
	if (!input?.length) {
		return [];
	}

	// do initial split
	const lines = codeBlockSafeSplit(input, options?.lineSplitter ?? "\n");

	// get maxChunkLength options
	const { maxChunkLength = 0 } = options ?? { };
	const isMaxChunkFn = typeof(maxChunkLength) === "function";

	// If there is no maxChunkLength, return them as is
	if (!isMaxChunkFn && maxChunkLength <= 0) {
		return lines;
	}

	/** @todo tokenize to ensure we don't break html / markdown / codeBlocks */

	const data: ChunkData = {
		chunks: [],
		currentChunk: undefined,
		currentIndex: -1,
		maxChunkLength: isMaxChunkFn ? maxChunkLength : () => maxChunkLength
	};

	// Iterate the lines
	lines.forEach((line, lineIndex) => chunkLine({ data, line, lineIndex, options }));

	// If we have a trailing chunk, make sure we include it
	if (data.currentChunk?.length ?? 0 > 0) {
		data.currentIndex = data.chunks.push(data.currentChunk!);
	}

	return data.chunks;
}
