import { addCommas } from "@rsc-utils/core-utils";
import { Coins } from "../../../sage-pf2e/index.js";
import type { SageMessage } from "../model/SageMessage.js";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd.js";

// #region rpg.SpUtils
async function spUtils(sageMessage: SageMessage): Promise<void> {
	const data = sageMessage.args.manager.raw().join(" ");

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

export function registerWealth(): void {
	registerCommandRegex(/^((?:\s*[\-\+]?\s*\d+(?:,\d{3})*\s*[csgp]p)+)$/i, spUtils);
}
