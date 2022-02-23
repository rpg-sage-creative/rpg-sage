import utils from "../../../sage-utils";
import { PROFICIENCIES, TProficiency, Coins, Table } from "../../../sage-pf2e";
import type SageMessage from "../model/SageMessage";
import { PatronTierType } from "../model/User";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp } from "./help";

// #region rpg.SpUtils
async function spUtils(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canUseFeature(PatronTierType.Friend)) {
		return sageMessage.reactPatreon();
	}

	const data = sageMessage.args.shift()!;

	// console.info("spUtils", data);
	const values = data.match(/\s*[\-\+]?\s*\d+(?:,\d{3})*\s*(?:cp|sp|gp|pp)/gi)!,
		signedAndSorted = values.map(s => ("+" + s).replace(/\s+/g, "").replace(/\+([\-\+])/, "$1").toLowerCase()).sort(),
		coins = new Coins();
	signedAndSorted.forEach(value => {
		if (value.startsWith("+")) {
			coins.add(value.slice(1));
		}
		if (value.startsWith("-")) {
			coins.subtract(value.slice(1));
		}
	});
	const content = createCommandRenderableContent(`<b>Coin Counter</b>`);
	content.append(`${data}\n\n${coins.toString()}\n(${utils.NumberUtils.addCommas(coins.spValue)} sp)`);
	return <any>sageMessage.send(content);
}
// #endregion

// #region Starting Wealth
async function startingWealth(sageMessage: SageMessage): Promise<void> {
	const levelString = sageMessage.args.shift()!;

	const table = Table.findByNumber("10-10")!,
		level = +levelString.replace(/st|nd|rd|th/, "");
	let renderable: utils.RenderUtils.RenderableContent;
	if (isNaN(level) || level < 1 || 20 < level) {
		renderable = table.toRenderableContent();
	} else {
		renderable = createCommandRenderableContent();
		const levelRow = table.rows[level];
		renderable.setTitle(`<b>Starting Wealth</b> (${utils.NumberUtils.nth(level)} Level)`);
		renderable.append(`<b>Permanent Items</b>`, `<blockquote>${levelRow[1].split(/,\s*/).join("\n")}</blockquote>`);
		renderable.append(`<b>Currency</b> ${levelRow[2]}`);
		renderable.append(`<h1>Optionally</h1>`);
		renderable.append(`<b>Lump Sum</b> ${levelRow[3]}`);
	}
	sageMessage.send(renderable);
}
// #endregion

// #region Earned Income
async function incomeEarnedA(sageMessage: SageMessage): Promise<void> {
	const taskLevelString = sageMessage.args.shift()!;
	const proficiencyString = sageMessage.args.shift()!;
	_incomeEarned(sageMessage, taskLevelString, proficiencyString);
}
async function incomeEarnedB(sageMessage: SageMessage): Promise<void> {
	const proficiencyString = sageMessage.args.shift()!;
	const taskLevelString = sageMessage.args.shift()!;
	_incomeEarned(sageMessage, taskLevelString, proficiencyString);
}
async function _incomeEarned(sageMessage: SageMessage, taskLevelString: string, proficiencyString: string): Promise<void> {
	console.info("incomeEarned", taskLevelString, proficiencyString);
	const table = Table.findByNumber("4-2")!,
		taskLevel = +taskLevelString,
		proficiencyLetter = <TProficiency>utils.StringUtils.capitalize(proficiencyString || "")[0],
		proficiencyIndex = PROFICIENCIES.findIndex(prof => prof[0] === proficiencyLetter),
		proficiency = PROFICIENCIES[proficiencyIndex];
	let renderable: utils.RenderUtils.RenderableContent;
	if (isNaN(taskLevel) || taskLevel < 0 || 20 < taskLevel) {
		renderable = table.toRenderableContent();
	} else {
		const levelRow = table.rows[taskLevel + 1],
			critRow = table.rows[taskLevel + 2];
		if (proficiencyIndex < 0) {
			renderable = createCommandRenderableContent();
			renderable.setTitle(`<b>Income Earned</b> (Task Level ${taskLevel})`);
			renderable.append(`<b>Failure</b> ${levelRow[1]}`);
			renderable.append(`<b>Trained</b> ${levelRow[2]}`);
			renderable.append(`<b>Expert</b> ${levelRow[3]}`);
			renderable.append(`<b>Master</b> ${levelRow[4]}`);
			renderable.append(`<b>Legendary</b> ${levelRow[5]}`);

			renderable.append(`<h1>Critical Success</h1>`);
			renderable.append(`<b>Trained</b> ${critRow[2]}`);
			renderable.append(`<b>Expert</b> ${critRow[3]}`);
			renderable.append(`<b>Master</b> ${critRow[4]}`);
			renderable.append(`<b>Legendary</b> ${critRow[5]}`);
		} else {
			renderable = createCommandRenderableContent();
			renderable.setTitle(`<b>Income Earned</b> (Task Level ${taskLevel}; ${proficiency})`);
			renderable.append(`<b>Failure</b> ${levelRow[1]}`);
			renderable.append(`<b>Success</b> ${levelRow[1 + proficiencyIndex]}`);
			renderable.append(`<b>Critical Success</b> ${critRow[1 + proficiencyIndex]}`);
		}
	}
	sageMessage.send(renderable);
}

export default function register(): void {
	registerCommandRegex(/^((?:\s*[\-\+]?\s*\d+(?:,\d{3})*\s*[csgp]p)+)$/i, spUtils);
	registerCommandHelp("Wealth", "Coin Counter", `{1pp} {2gp} {3sp} {4cp}\n{1pp} {-2gp} {+3sp} {-4cp}\n<b>[permission-patreon] Patron Feature (Friend+)</b>`);

	registerCommandRegex(/^\s*(?:starting|character)\s*wealth\s*(\d+(?:st|nd|rd|th)?)?\s*$/i, startingWealth);
	const CHARACTER_WEALTH = "Starting Wealth";
	registerCommandHelp("Wealth", CHARACTER_WEALTH, `starting wealth`);
	registerCommandHelp("Wealth", CHARACTER_WEALTH, `starting wealth {level}`);

	registerCommandRegex(/^\s*income\s*earned\s*(\d{1,2})?\s*(trained|expert|master|legendary|t|e|m|l)?\s*$/i, incomeEarnedA);
	registerCommandRegex(/^\s*income\s*earned\s*(trained|expert|master|legendary|t|e|m|l)\s*(\d{1,2})\s*$/i, incomeEarnedB);
	const INCOME_EARNED = "Income Earned";
	registerCommandHelp("Wealth", INCOME_EARNED, `income earned`);
	registerCommandHelp("Wealth", INCOME_EARNED, `income earned {taskLevel}`);
	registerCommandHelp("Wealth", INCOME_EARNED, `income earned {taskLevel} {proficiency}`);
}
