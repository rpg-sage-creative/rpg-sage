import type { TDicePart } from "./dice/DicePart.js";

type MapDicePartRollOptions = {
	hideRolls: boolean;
	isRollem?: boolean;
	noDescription?: boolean;
	noDice?: boolean;
	noModifier?: boolean;
};

function dicePartToRollString(dicePart: TDicePart, hideRolls?: boolean): string {
	const sortedRollData = dicePart.sortedRollData;
	if (sortedRollData?.count) {
		const outputRollsAndIndexes = sortedRollData.noSort ? sortedRollData.byIndex : sortedRollData.byValue;
		const mappedOutputRolls = outputRollsAndIndexes.map(rollData => rollData.text);
		const output = `[${mappedOutputRolls.join(", ")}]`;
		return hideRolls ? `||${output}||` : output;
	}
	return "";
}

export function mapDicePartToRollString(dicePart: TDicePart, dicePartIndex: number, options: MapDicePartRollOptions): string {
	let dicePartRollOutput = "";


	// leading sign
	const sign = dicePart.sign ?? "+";
	const includeSign = dicePartIndex > 0 || sign !== "+";
	if (includeSign && (dicePart.hasValue || !dicePart.hasTest)) {
		dicePartRollOutput += ` ${dicePart.sign ?? "+"}`;
	}

	// dice
	const showRolls = dicePart.hasDie || !(dicePart.modifier || dicePart.hasTest);
	if (showRolls) {
		dicePartRollOutput += ` ${dicePartToRollString(dicePart, options.hideRolls)}`;
		if (!options.noDice) {
			const rollemSpacer = options.isRollem ? " " : "";
			dicePartRollOutput += `${rollemSpacer}${dicePart.count}d${dicePart.sides}`;
		}
	}

	// modifier
	if (!options.noModifier && dicePart.hasModifier) {
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