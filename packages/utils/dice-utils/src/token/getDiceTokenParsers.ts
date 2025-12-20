import { DiceTest } from "../DiceTest.js";
import type { TokenParsers } from "../internal/tokenize.js";
import { DiceDropKeep } from "../manipulate/DiceDropKeep.js";
import { DiceExplode } from "../manipulate/DiceExplode.js";
import { DiceThreshold } from "../manipulate/DiceThreshold.js";
import { getDiceRegex } from "./getDiceRegex.js";

const NoSortRegExp = /(ns)/i;
const ModRegExp = /([-+*/])\s*(\d+)(?!d\d)/i;
const QuotesRegExp = /`[^`]+`|“[^”]+”|„[^“]+“|„[^”]+”|"[^"]+"/;

/** Returns a new object with the default dice parsers for use with Tokenizer */
export function getDiceTokenParsers(): TokenParsers {
	return {
		dice: getDiceRegex(),
		...DiceDropKeep.getParsers(),
		...DiceThreshold.getParsers(),
		...DiceExplode.getParsers(),
		noSort: NoSortRegExp,
		mod: ModRegExp,
		quotes: QuotesRegExp,
		...DiceTest.getParsers()
	};
}