import { DiceTest } from "../DiceTest.js";
import type { TokenParsers } from "../internal/tokenize.js";
import { DiceDropKeep } from "../manipulate/DiceDropKeep.js";
import { DiceExplode } from "../manipulate/DiceExplode.js";
import { DiceThreshold } from "../manipulate/DiceThreshold.js";
import { getDiceRegex } from "./getDiceRegex.js";

/** Returns a new object with the default dice parsers for use with Tokenizer */
export function getDiceTokenParsers(): TokenParsers {
	return {
		dice: getDiceRegex(),
		...DiceDropKeep.getParsers(),
		...DiceThreshold.getParsers(),
		...DiceExplode.getParsers(),
		noSort: /(ns)/i,
		mod: /([-+*/])\s*(\d+)(?!d\d)/i,
		quotes: /`[^`]+`|“[^”]+”|„[^“]+“|„[^”]+”|"[^"]+"/,
		...DiceTest.getParsers()
	};
}