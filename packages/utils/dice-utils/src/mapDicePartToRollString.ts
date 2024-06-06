import { TDicePart } from "./dice/DicePart.js";

type MapDicePartRollOptions = {
	hideRolls: boolean;
	isRollem?: boolean;
	noDescription?: boolean;
	noDice?: boolean;
	noModifier?: boolean;
};

function dicePartToRollString(dicePart: TDicePart, hideRolls?: boolean): string {
	const sortedRollData = dicePart.sortedRollData;
	if (sortedRollData) {
		const outputRollsAndIndexes = sortedRollData.noSort ? sortedRollData.byIndex : sortedRollData.byValue;
		const mappedOutuputRolls = outputRollsAndIndexes.map(rollData => rollData.text);
		const output = `[${mappedOutuputRolls.join(", ")}]`;
		return hideRolls ? `||${output}||` : output;
	}
	return "";
}

export function mapDicePartToRollString(dicePart: TDicePart, dicePartIndex: number, options: MapDicePartRollOptions): string {
	let dicePartRollOutput = "";

	// leading sign
	const sign = dicePart.sign ?? "+";
	const includeSign = dicePartIndex > 0 || sign !== "+";
	if (includeSign && (dicePart.hasDie || dicePart.modifier)) {
		dicePartRollOutput += ` ${dicePart.sign ?? "+"}`;
	}

	// dice
	if (dicePart.hasDie) {
		dicePartRollOutput += ` ${dicePartToRollString(dicePart, options.hideRolls)}`;
		if (!options.noDice) {
			const rollemSpacer = options.isRollem ? " " : "";
			dicePartRollOutput += `${rollemSpacer}${dicePart.count}d${dicePart.sides}`;
		}
	}

	// modifier
	if (!options.noModifier && dicePart.modifier) {
		dicePartRollOutput += ` ${Math.abs(dicePart.modifier)}`;
	}

	// description
	if (!options.noDescription) {
		dicePartRollOutput += ` ${dicePart.description}`;
	}

	// test
	if (dicePart.hasTest) {
		const { alias, value, isHidden } = dicePart.test;
		dicePartRollOutput += ` ${alias} ${isHidden ? "??" : value}`;
	}

	//cleanup
	return dicePartRollOutput.replace(/ +/g, " ").trim();
}