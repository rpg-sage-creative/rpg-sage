import type { DicePartCore } from "../dice/DicePart.js";
import type { TokenData } from "../internal/tokenize.js";
import { DiceDropKeep } from "./DiceDropKeep.js";
import { DiceExplode } from "./DiceExplode.js";
import { DiceThreshold } from "./DiceThreshold.js";

type DiceManipulation = { isEmpty:boolean; };
function notEmpty<T extends DiceManipulation>(dm: T): T | undefined {
	return dm.isEmpty ? undefined : dm;
}

export function appendManipulationToCore(core: DicePartCore, token: TokenData, index: number, tokens: TokenData[]): boolean {
	const lastToken = tokens[index - 1];
	if (["dice", "dropKeep", "explode", "noSort", "threshold"].includes(lastToken?.key)) {
		const dropKeep = new DiceDropKeep(DiceDropKeep.parseData(token));

		const explode = new DiceExplode(DiceExplode.parseData(token, core.sides));

		/** @todo consider adding a second ns to a dice roll as breaking the chain adn starting a description? */
		const noSort = token.key === "noSort";

		const threshold = new DiceThreshold(DiceThreshold.parseData(token));

		if (!dropKeep.isEmpty || !explode.isEmpty || noSort || !threshold.isEmpty) {
			const manipulation = core.manipulation ?? (core.manipulation = []);
			manipulation.push({
				dropKeep: notEmpty(dropKeep),
				explode: notEmpty(explode),
				noSort: noSort ? true : undefined,
				threshold: notEmpty(threshold)
			});
			return true;
		}
	}
	return false;
}