import { debug } from "@rsc-utils/core-utils";
import { addCommas } from "@rsc-utils/number-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import { capitalize } from "@rsc-utils/string-utils";
import { Coins, PROFICIENCIES, type TProficiency, Table } from "../../../sage-pf2e/index.js";
import type { SageMessage } from "../model/SageMessage.js";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd.js";

// #region rpg.SpUtils
async function spUtils(sageMessage: SageMessage): Promise<void> {
	const data = sageMessage.args.toArray()[0];

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
	content.append(`${data}\n\n${coins.toString()}\n(${addCommas(coins.spValue)} sp)`);
	return <any>sageMessage.send(content);
}
// #endregion

// #region Earned Income
async function incomeEarnedA(sageMessage: SageMessage): Promise<void> {
	const [taskLevelString, proficiencyString] = sageMessage.args.toArray();
	_incomeEarned(sageMessage, taskLevelString, proficiencyString);
}
async function incomeEarnedB(sageMessage: SageMessage): Promise<void> {
	const [proficiencyString, taskLevelString] = sageMessage.args.toArray();
	_incomeEarned(sageMessage, taskLevelString, proficiencyString);
}
async function _incomeEarned(sageMessage: SageMessage, taskLevelString: string, proficiencyString: string): Promise<void> {
	debug("incomeEarned", taskLevelString, proficiencyString);
	const table = Table.findByNumber("4-2")!,
		taskLevel = +taskLevelString,
		proficiencyLetter = <TProficiency>capitalize(proficiencyString || "")[0],
		proficiencyIndex = PROFICIENCIES.findIndex(prof => prof[0] === proficiencyLetter),
		proficiency = PROFICIENCIES[proficiencyIndex];
	let renderable: RenderableContent;
	if (!taskLevelString.trim() || isNaN(taskLevel) || taskLevel < 0 || 20 < taskLevel) {
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

export function registerWealth(): void {
	registerCommandRegex(/^((?:\s*[\-\+]?\s*\d+(?:,\d{3})*\s*[csgp]p)+)$/i, spUtils);
	registerCommandRegex(/^\s*income\s*earned\s*(\d{1,2})?\s*(trained|expert|master|legendary|t|e|m|l)?\s*$/i, incomeEarnedA);
	registerCommandRegex(/^\s*income\s*earned\s*(trained|expert|master|legendary|t|e|m|l)\s*(\d{1,2})\s*$/i, incomeEarnedB);
}
