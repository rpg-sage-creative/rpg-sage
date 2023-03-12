import utils, { Optional } from "../../../sage-utils";
import { PROFICIENCIES, Table } from "../../../sage-pf2e";
import type SageMessage from "../model/SageMessage";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp } from "./help";
import { registerSlashCommand } from "../../../slash.mjs";
import type SageInteraction from "../model/SageInteraction";
import type { TSlashCommand } from "../../../types";
import { registerInteractionListener } from "../../discord/handlers";

//#region simple dcs

function _simpleDcs(proficiency: Optional<string>): utils.RenderUtils.RenderableContent {
	const table = Table.findByNumber("10-4")!,
		proficiencyLetter = utils.StringUtils.capitalize(proficiency ?? "")[0],
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
	const renderable = _simpleDcs(sageMessage.args.valueAt(0));
	return sageMessage.send(renderable) as Promise<any>;
}

//#endregion

//#region dcs by level

function _dcsByLevel(bySpell: boolean, level: Optional<number>): utils.RenderUtils.RenderableContent {
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
	const renderable = _dcsByLevel(sageMessage.args.valueAt(0) === "spell", +sageMessage.args[1]);
	return sageMessage.send(renderable) as Promise<any>;
}

//#endregion

//#region slash command

function slashTester(sageInteraction: SageInteraction): boolean {
	return sageInteraction.isCommand("PF2E", "DCs");
}

async function slashHandler(sageInteraction: SageInteraction): Promise<void> {
	const table = sageInteraction.args.getString<"simple" | "level" | "spell">("table", true);
	if (table === "simple") {
		const proficiency = sageInteraction.args.getString("proficiency");
		return sageInteraction.reply(_simpleDcs(proficiency), false);
	}
	const level = sageInteraction.args.getNumber("level");
	return sageInteraction.reply(_dcsByLevel(table === "spell", level), false);
}

function dcCommand(): TSlashCommand {
	return {
		name: "DCs",
		description: "Show Difficulty Classes",
		options: [
			{ name:"table", description:"Which DCs?", choices:[
				{ name:"Simple", value:"simple" },
				{ name:"By Level", value:"level" },
				{ name:"By Spell Level", value:"spell" }
			], isRequired:true },
			{ name:"proficiency", description:"What Proficiency?", choices:["U","T","E","M","L"] },
			{ name:"level", description:"Which Level?", isNumber:true }
		]
	};
}

//#endregion

export function registerCommandHandlers(): void {
	registerCommandRegex(/^\s*simple\s*dcs?\s*([a-z]+)\s*$/i, simpleDcs);
	registerCommandRegex(/^\s*([a-z]+)\s*simple\s*dcs?\s*$/i, simpleDcs);
	registerCommandHelp("Command", "DCs", `simple dc PROFICIENCY`);
	registerCommandHelp("Command", "DCs", `PROFICIENCY simple dc`);

	registerCommandRegex(/^\s*dcs?\s*by\s*level\s*$/i, dcsByLevel);
	registerCommandRegex(/^\s*dc(?:\s*by)?\s*(spell)?\s*level\s*(\d+)(?:st|nd|rd|th)?\s*$/i, dcsByLevel);
	registerCommandHelp("Command", "DCs", `dcs by level`);
	registerCommandHelp("Command", "DCs", `dc by level LEVEL`);
	registerCommandHelp("Command", "DCs", `dc by spell level LEVEL`);

	registerInteractionListener(slashTester, slashHandler);
}

export function registerSlashCommands(): void {
	registerSlashCommand("PF2E", dcCommand());
}
