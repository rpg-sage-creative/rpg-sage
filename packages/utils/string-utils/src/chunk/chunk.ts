import type { ChunkData } from "./ChunkData.js";
import type { ChunkOptions } from "./ChunkOptions.js";
import type { MaxChunkLengthCallback } from "./MaxChunkLengthCallback.js";
import { chunkLine } from "./chunkLine.js";
import { parseChunkOptions } from "./parseChunkOptions.js";

/**
 * Splits input into chunks using the default options ensuring that no "chunk" is greater than maxChunkLength (if given).
 * Default options: lineSplitter (default "\n"), wordSplitter (default " ")
 */
export function chunk(input: string): string[];

/** Splits input into chunks using the given options to override the defaults. */
export function chunk(input: string, opts: ChunkOptions): string[];

/** Splits input into chunks using the given maxChunkLength and the default options */
export function chunk(input: string, maxChunkLength: number): string[];

/** Splits input into chunks using the given maxChunkLength callback and the default options */
export function chunk(input: string, maxChunkLengthCallback: MaxChunkLengthCallback): string[];

// export function chunk(input: string, maxChunkLength: number, opts: TChunkOptions): string[];

export function chunk(input: string, argOne?: number | ChunkOptions | MaxChunkLengthCallback, argTwo?: ChunkOptions): string[] {
	const options = parseChunkOptions(argOne, argTwo);

	// Split into lines
	const lines = input.split(options.lineSplitter);

	// If there is no maxChunkLength, return them as is
	if (typeof(options.maxChunkLength) !== "function" && (options.maxChunkLength ?? 0) <= 0) {
		return lines;
	}

	/** @todo tokenize to ensure we don't break html / markdown */

	const data: ChunkData = {
		chunks: [],
		currentChunk: undefined,
		currentIndex: -1,
		maxChunkLength: typeof options.maxChunkLength === "function"
			? options.maxChunkLength
			: () => options.maxChunkLength as number
	};

	// Iterate the lines
	lines.forEach((line, lineIndex) => chunkLine(data, options, line, lineIndex));

	// If we have a trailing chunk, make sure we include it
	if (data.currentChunk?.length ?? 0 > 0) {
		data.currentIndex = data.chunks.push(data.currentChunk!);
	}

	return data.chunks;
}
