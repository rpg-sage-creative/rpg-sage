import { codeBlockSafeSplit } from "./codeBlockSafeSplit.js";

type StringSplitter = {
	/** @private contains the value to split on */
	_splitter: string | RegExp;
	/** the split symbol used by String.split */
	[Symbol.split](value:string, limit?: number): string[];
};

/**
 * Creates a string splitter that is capable of ignoring code blocks using backticks (`).
 * Defaults to splitting on "\n".
 */
export function getCodeBlockSafeSplitter(): StringSplitter;
/**
 * Creates a string splitter that is capable of ignoring code blocks using backticks (`).
 */
export function getCodeBlockSafeSplitter(splitter: string | RegExp): StringSplitter;
export function getCodeBlockSafeSplitter(splitter: string | RegExp = "\n"): StringSplitter {
	return {
		_splitter: splitter,
		[Symbol.split](value: string, limit?: number): string[] {
			if (value.includes("`")) {
				return codeBlockSafeSplit(value, this._splitter, limit);
			}
			return value.split(this._splitter, limit);
		}
	};
}