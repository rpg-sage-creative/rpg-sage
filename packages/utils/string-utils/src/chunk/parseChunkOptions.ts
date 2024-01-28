import type { ChunkOptions } from "./ChunkOptions.js";
import type { MaxChunkLengthCallback } from "./MaxChunkLengthCallback.js";

function isFunctionOrNumber(arg?: number | ChunkOptions | MaxChunkLengthCallback): arg is number | MaxChunkLengthCallback {
	const type = typeof(arg);
	return type === "function" || type === "number";
}

/** @internal Parses the given arguments into ChunkOptions */
export function parseChunkOptions(argOne?: number | ChunkOptions | MaxChunkLengthCallback, argTwo?: ChunkOptions): ChunkOptions {
	if (isFunctionOrNumber(argOne)) {
		// use the options from argTwo, if present, but overwrite the maxChunkLength
		return {
			lineSplitter: argTwo?.lineSplitter ?? "\n",
			maxChunkLength: argTwo?.maxChunkLength ?? argOne as number,
			newLineCharacter: argTwo?.newLineCharacter ?? "\n",
			spaceCharacter: argTwo?.spaceCharacter ?? " ",
			wordSplitter: argTwo?.wordSplitter ?? " "
		};
	}
	// argTwo > argOne > default
	return {
		lineSplitter: argTwo?.lineSplitter ?? argOne?.lineSplitter ?? "\n",
		maxChunkLength: argTwo?.maxChunkLength ?? argOne?.maxChunkLength!,
		newLineCharacter: argTwo?.newLineCharacter ?? argOne?.newLineCharacter ?? "\n",
		wordSplitter: argTwo?.wordSplitter ?? argOne?.wordSplitter ?? " ",
		spaceCharacter: argTwo?.spaceCharacter ?? argOne?.spaceCharacter ?? " "
	};
}
