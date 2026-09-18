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