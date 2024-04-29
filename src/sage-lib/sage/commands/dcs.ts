import type { RenderableContent } from "@rsc-utils/render-utils";
import { capitalize } from "@rsc-utils/string-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { PROFICIENCIES, Table } from "../../../sage-pf2e/index.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { SageInteraction } from "../model/SageInteraction.js";
import type { SageMessage } from "../model/SageMessage.js";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd.js";
import { registerCommandHelp } from "./help.js";

//#region simple dcs

function _simpleDcs(proficiency: Optional<string>): RenderableContent {
	const table = Table.findByNumber("10-4")!,
		proficiencyLetter = capitalize(proficiency ?? "")[0],
		proficiencyLetterIndex = PROFICIENCIES.findIndex(prof => prof[0] === proficiencyLetter);
	if (proficiencyLetterIndex < 0) {
		return table.toRenderableContent();
	} else {
		const row = table.rows[proficiencyLetterIndex + 1],
			renderable = createCommandRenderableContent();
		renderable.append(`<b>Simple DC: ${row[0]} (${row[1]})</b>`);
		return renderable;
	}
}

function simpleDcs(sageMessage: SageMessage): Promise<void> {
	const renderable = _simpleDcs(sageMessage.args.toArray()[0]);
	return sageMessage.send(renderable) as Promise<any>;
}

//#endregion

//#region dcs by level

function _dcsByLevel(bySpell: boolean, level: Optional<number>): RenderableContent {
	const table = Table.findByNumber("10-5")!;
	if (!level) {
		return table.toRenderableContent();
	}

	let rowIndex = level + 1;
	if (bySpell) {
		rowIndex += 26;
	}
	const row = table.rows[rowIndex],
		renderable = createCommandRenderableContent();
	renderable.append(`<b>DC by${bySpell ? " Spell" : ""} Level: ${row[0]} (${row[1]})</b>`);
	return renderable;
}

async function dcsByLevel(sageMessage: SageMessage): Promise<void> {
	const args = sageMessage.args.toArray();
	const renderable = _dcsByLevel(args[0] === "spell", +args[1]);
	return sageMessage.send(renderable) as Promise<any>;
}

//#endregion

//#region slash command

async function slashHandler(sageInteraction: SageInteraction): Promise<void> {
	const table = sageInteraction.args.getString<"simple" | "level" | "spell">("table", true);
	if (table === "simple") {
		const proficiency = sageInteraction.args.getString("proficiency");
		return sageInteraction.reply(_simpleDcs(proficiency), false);
	}
	const level = sageInteraction.args.getNumber("level");
	return sageInteraction.reply(_dcsByLevel(table === "spell", level), false);
}

//#endregion

export function registerDcs(): void {
	registerCommandRegex(/^\s*simple\s*dcs?\s*([a-z]+)\s*$/i, simpleDcs);
	registerCommandRegex(/^\s*([a-z]+)\s*simple\s*dcs?\s*$/i, simpleDcs);
	registerCommandHelp("Command", "DCs", `simple dc PROFICIENCY`);
	registerCommandHelp("Command", "DCs", `PROFICIENCY simple dc`);

	registerCommandRegex(/^\s*dcs?\s*by\s*level\s*$/i, dcsByLevel);
	registerCommandRegex(/^\s*dc(?:\s*by)?\s*(spell)?\s*level\s*(\d+)(?:st|nd|rd|th)?\s*$/i, dcsByLevel);
	registerCommandHelp("Command", "DCs", `dcs by level`);
	registerCommandHelp("Command", "DCs", `dc by level LEVEL`);
	registerCommandHelp("Command", "DCs", `dc by spell level LEVEL`);

	registerListeners({ commands:["PF2E|DCs"], interaction:slashHandler });
}
