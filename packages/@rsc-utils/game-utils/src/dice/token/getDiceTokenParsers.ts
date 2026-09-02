import { MisquotedContentRegExp, QuotedContentRegExp, type TokenParsers } from "@rsc-utils/core-utils";
import { DiceTest } from "../DiceTest.js";
import { DiceDropKeep } from "../manipulate/DiceDropKeep.js";
import { DiceExplode } from "../manipulate/DiceExplode.js";
import { DiceThreshold } from "../manipulate/DiceThreshold.js";
import { DiceRegExp } from "./DiceRegExp.js";

const NoSortRegExp = /(ns)/i;
const ModRegExp = /([\-+\/*])\s*(\d+)(?!d\d)/i;
const EscapedRegExp = /`[^`]*`/;

/** Returns a new object with the default dice parsers for use with Tokenizer */
export function getDiceTokenParsers(): TokenParsers {
	return {
		dice: DiceRegExp,
		...DiceDropKeep.getParsers(),
		...DiceThreshold.getParsers(),
		...DiceExplode.getParsers(),
		noSort: NoSortRegExp,
		mod: ModRegExp,
		escaped: EscapedRegExp,
		quoted: QuotedContentRegExp,
		misquoted: MisquotedContentRegExp,
		...DiceTest.getParsers()
	};
}