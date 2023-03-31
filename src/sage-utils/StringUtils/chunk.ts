
/** Function to allow for variable chunk lengths. */
type TChunkOptionsMaxChunkLengthCallback = (chunkIndex: number) => number;

/** Options for how to split the text when creating chunks. */
export type TChunkOptions = {
	/** used to split lines; default "\n" */
	lineSplitter: string | RegExp;
	/** how long a chunk should be */
	maxChunkLength: number | TChunkOptionsMaxChunkLengthCallback;
	/** used to join lines; default "\n" */
	newLineCharacter: string;
	/** used to join words; default " " */
	spaceCharacter: string;
	/** used to split words; default " " */
	wordSplitter: string | RegExp;
};

/** Convenient way of checking and casting the data type. */
function isMaxChunkLengthOrCallback(maxChunkLength: number | TChunkOptions | TChunkOptionsMaxChunkLengthCallback | undefined): maxChunkLength is number | TChunkOptionsMaxChunkLengthCallback {
	const type = typeof(maxChunkLength);
	return type === "function" || type === "number";
}

/** Create chunk options from defaults with the given maxChunkLength. */
function numberToChunkOptions(maxChunkLength: number | TChunkOptionsMaxChunkLengthCallback, options?: TChunkOptions): TChunkOptions {
	return {
		lineSplitter: options?.lineSplitter ?? "\n",
		maxChunkLength: options?.maxChunkLength ?? maxChunkLength,
		newLineCharacter: options?.newLineCharacter ?? "\n",
		spaceCharacter: options?.spaceCharacter ?? " ",
		wordSplitter: options?.wordSplitter ?? " "
	};
}
function optionsToChunkOptions(optionsOne?: TChunkOptions, optionsTwo?: TChunkOptions): TChunkOptions {
	return {
		lineSplitter: optionsTwo?.lineSplitter ?? optionsOne?.lineSplitter ?? "\n",
		maxChunkLength: optionsTwo?.maxChunkLength ?? optionsOne?.maxChunkLength!,
		newLineCharacter: optionsTwo?.newLineCharacter ?? optionsOne?.newLineCharacter ?? "\n",
		wordSplitter: optionsTwo?.wordSplitter ?? optionsOne?.wordSplitter ?? " ",
		spaceCharacter: optionsTwo?.spaceCharacter ?? optionsOne?.spaceCharacter ?? " "
	};
}
function parseChunkOptions(argOne?: number | TChunkOptions | TChunkOptionsMaxChunkLengthCallback, argTwo?: TChunkOptions): TChunkOptions {
	if (isMaxChunkLengthOrCallback(argOne)) {
		return numberToChunkOptions(argOne, argTwo);
	}
	return optionsToChunkOptions(argOne, argTwo);
}

type TChunkInfo = {
	chunks: string[];
	currentChunk: string;
	currentIndex: number;
	maxChunkLength: TChunkOptionsMaxChunkLengthCallback;
};

/** Splits input into chunks using lineSplitter (default "\n") and wordSplitter (default " "), ensuring that no "chunk" is greater than maxChunkLength. */
export function chunk(input: string): string[];
export function chunk(input: string, opts: TChunkOptions): string[];
export function chunk(input: string, maxChunkLength: number): string[];
export function chunk(input: string, maxChunkLengthCallback: TChunkOptionsMaxChunkLengthCallback): string[];
// export function chunk(input: string, maxChunkLength: number, opts: TChunkOptions): string[];
export function chunk(input: string, argOne?: number | TChunkOptions | TChunkOptionsMaxChunkLengthCallback, argTwo?: TChunkOptions): string[] {
	const options = parseChunkOptions(argOne, argTwo);

	// Split into lines
	const lines = input.split(options.lineSplitter);

	// If there is no maxChunkLength, return them as is
	if (typeof(options.maxChunkLength) !== "function" && (options.maxChunkLength ?? 0) <= 0) {
		return lines;
	}

	/** @todo tokenize to ensure we don't break html / markdown */

	const info: TChunkInfo = {
		chunks: [],
		currentChunk: "",
		currentIndex: 0,
		maxChunkLength: typeof options.maxChunkLength === "function"
			? options.maxChunkLength
			: () => options.maxChunkLength as number
	};

	// Iterate the lines
	lines.forEach((line, lineIndex) => chunkLine(info, options, line, lineIndex));

	// If we have a trailing chunk, make sure we include it
	if (info.currentChunk.length > 0) {
		info.currentIndex = info.chunks.push(info.currentChunk);
	}

	return info.chunks;
}
function chunkLine(info: TChunkInfo, options: TChunkOptions, line: string, lineIndex: number): void {
	// We don't want a leading newLine
	const newLine = lineIndex > 0 ? options.newLineCharacter : "";

	// Test if the line would put the chunk over the maxChunkLength
	if (info.currentChunk.length + newLine.length + line.length < info.maxChunkLength(info.currentIndex)) {
		// If not, simply add it, including newLine since we split on that
		info.currentChunk += newLine + line;

	}else {
		// We know we are too long, so we push the current chunk and start a new one
		info.currentIndex = info.chunks.push(info.currentChunk);

		// Check to see if the line's length is shorter than maxChunkLength
		if (line.length < info.maxChunkLength(info.currentIndex)) {
			// If shorter, use it to start the new chunk
			info.currentChunk = line;

		}else {
			// The line needs to be split up, so start an empty chunk
			info.currentChunk = "";

			// Split the line into words (generally splitting on " ")
			const words = line.split(options.wordSplitter);

			// Iterate the words
			words.forEach((word, wordIndex) => chunkWord(info, options, word, wordIndex));

			// Include the last, trailing chunk
			info.currentIndex = info.chunks.push(info.currentChunk);

			// End of line, end of chunk
			info.currentChunk = "";
		}
	}
}
function chunkWord(info: TChunkInfo, options: TChunkOptions, word: string, wordIndex: number): void {
	// We don't want a leading space
	const space = wordIndex > 0 ? options.spaceCharacter : "";

	// Test if the word would put the chunk over the maxChunkLength
	if (info.currentChunk.length + space.length + word.length < info.maxChunkLength(info.currentIndex)) {
		// If not, simply add it, including the space since we split on that
		info.currentChunk += space + word;

	}else {
		// We know we are too long, so we push the current chunk and start a new one
		info.currentIndex = info.chunks.push(info.currentChunk);

		// Start the new chunk with the current word
		info.currentChunk = word;
	}
}
