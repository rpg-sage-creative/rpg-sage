import type { Optional } from "@rsc-utils/type-utils";
import { codeBlockSafeSplit } from "./codeBlocks/codeBlockSafeSplit.js";

/** Data representing the current chunk process. */
type ChunkData = {
	/** all the chunks created */
	chunks: string[];

	/** the chunk currently being processed */
	currentChunk?: string;

	/** the index of the chunk currently being processed */
	currentIndex: number;

	/** the callback to determing the maxChunkLength */
	maxChunkLength: MaxChunkLengthCallback;
};

//#region chunkWord

type ChunkWordArgs = {
	data: ChunkData;
	options?: ChunkOptions;
	word: string;
	wordIndex: number
};

/** Creates a new chunk if adding the word would cause the current chunk to become too long. */
function chunkWord({ data, options, word, wordIndex }: ChunkWordArgs): void {
	const { spaceCharacter = " " } = options ?? {};

	// Treat undefined as empty string for length and concatenation
	const currentChunk = data.currentChunk ?? "";

	// We don't want a leading space
	const space = 0 < wordIndex ? spaceCharacter : "";

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

//#endregion

//#region chunkLine

type ChunkLineArgs = {
	data: ChunkData;
	line: string;
	lineIndex: number
	options?: ChunkOptions;
};

/** Breaks down a line if adding it would cause the current chunk to become too long. */
function chunkLine({ data, line, options }: ChunkLineArgs): void {
	const { newLineCharacter = "\n", wordSplitter = " " } = options ?? {};

	// Treat undefined as empty string for length and concatenation
	const currentChunk = data.currentChunk ?? "";

	// We don't want a leading newLine
	const newLine = data.currentChunk !== undefined ? newLineCharacter : "";

	// Test if the line would put the chunk over the maxChunkLength
	const maxChunkLength = data.maxChunkLength(data.currentIndex);
	if (currentChunk.length + newLine.length + line.length < maxChunkLength) {
		// If not, simply add it, including newLine since we split on that
		data.currentChunk = currentChunk + newLine + line;

		// If we are at index -1, set it to 0 ... otherwise keep our index
		data.currentIndex = Math.max(data.currentIndex, 0);

	}else {
		// We know we are too long, so we push the current chunk (if we have one) and start a new one
		if (data.currentChunk !== undefined) {
			// Push the current chunk and save the new index
			data.currentIndex = data.chunks.push(data.currentChunk);
		}

		// If we are at index -1, set it to 0 ... otherwise keep our index
		data.currentIndex = Math.max(data.currentIndex, 0);

		// Check to see if the line's length is shorter than maxChunkLength
		if (line.length < data.maxChunkLength(data.currentIndex)) {
			// If shorter, use it to start the new chunk
			data.currentChunk = line;

		}else {
			// The line needs to be split up, so start an empty chunk
			data.currentChunk = "";

			// Split the line into words (generally splitting on " ")
			const words = codeBlockSafeSplit(line, wordSplitter);

			// Iterate the words
			words.forEach((word, wordIndex) => chunkWord({ data, options, word, wordIndex }));

			// Include the last, trailing chunk
			data.currentIndex = data.chunks.push(data.currentChunk);

			// End of line, end of chunk
			data.currentChunk = "";
		}
	}
}

//#endregion

/** Function to allow for variable chunk lengths. */
export type MaxChunkLengthCallback = (chunkIndex: number) => number;

/** Options for how to split the text when creating chunks. */
export type ChunkOptions = {
	/** used to split lines; default "\n" */
	lineSplitter?: string | RegExp;

	/** how long a chunk should be */
	maxChunkLength?: number | MaxChunkLengthCallback;

	/** used to join lines; default "\n" */
	newLineCharacter?: string;

	/** used to join words; default " " */
	spaceCharacter?: string;

	/** used to split words; default " " */
	wordSplitter?: string | RegExp;
};

/**
 * Splits input into chunks ensuring that no "chunk" is greater than maxChunkLength (if given).
 * Default options: lineSplitter (default "\n"), wordSplitter (default " ")
 */
export function chunk(input: Optional<string>, options?: ChunkOptions): string[] {
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
