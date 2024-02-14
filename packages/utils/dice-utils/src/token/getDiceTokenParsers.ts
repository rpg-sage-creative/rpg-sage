import type { TokenParsers } from "@rsc-utils/string-utils";
import { DiceTest } from "../DiceTest.js";
import { DiceDropKeep } from "../manipulate/DiceDropKeep.js";
import { DiceExplode } from "../manipulate/DiceExplode.js";
import { DiceThreshold } from "../manipulate/DiceThreshold.js";

// dice parser parts
// sign:  ([\-\+\*\/])?
// rolls: (?:\s*\((\s*\d*(?:\s*,\s*\d+)*\s*)\))?
// count: (?:\s*(\d+)\s*|\b)
// sides: d\s*(\d+)

/** Returns a new object with the default dice parsers for use with Tokenizer */
export function getDiceTokenParsers(): TokenParsers {
	return {
		dice: /([-+*/])?(?:\s*\((\s*\d*(?:\s*,\s*\d+)*\s*)\))?(?:\s*(\d+)\s*|\b)d\s*(\d+)/i,
		...DiceDropKeep.getParsers(),
		...DiceThreshold.getParsers(),
		...DiceExplode.getParsers(),
		noSort: /(ns)/i,
		mod: /([-+*/])\s*(\d+)(?!d\d)/i,
		quotes: /`[^`]+`|“[^”]+”|„[^“]+“|„[^”]+”|"[^"]+"/,
		...DiceTest.getParsers()
	};
}