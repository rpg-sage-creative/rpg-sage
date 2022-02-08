import utils from "../../../sage-utils";
import { PROFICIENCIES, Table } from "../../../sage-pf2e";
import type SageMessage from "../model/SageMessage";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp } from "./help";


async function simpleDcs(sageMessage: SageMessage): Promise<void> {
	const table = Table.findByNumber("10-4")!,
		proficiencyLetter = utils.StringUtils.capitalize(sageMessage.args[0] ?? "")[0],
		proficiencyLetterIndex = PROFICIENCIES.findIndex(proficiency => proficiency[0] === proficiencyLetter);
	if (proficiencyLetterIndex < 0) {
		sageMessage.send(table.toRenderableContent());
	} else {
		const row = table.rows[proficiencyLetterIndex + 1],
			renderable = createCommandRenderableContent();
		renderable.append(`<b>Simple DC: ${row[0]} (${row[1]})</b>`);
		sageMessage.send(renderable);
	}
}

async function dcsByLevel(sageMessage: SageMessage): Promise<void> {
	const table = Table.findByNumber("10-5")!,
		spellString = sageMessage.args[0],
		levelString = sageMessage.args[1],
		level = +levelString;
	if (levelString === undefined) {
		sageMessage.send(table.toRenderableContent());
	} else {
		let rowIndex = level + 1;
		if (spellString) {
			rowIndex += 26;
		}
		const row = table.rows[rowIndex],
			renderable = createCommandRenderableContent();
		renderable.append(`<b>DC by${spellString ? " Spell" : ""} Level: ${row[0]} (${row[1]})</b>`);
		sageMessage.send(renderable);
	}
}

export default function register(): void {
	registerCommandRegex(/^\s*simple\s*dcs?\s*([a-z]+)\s*$/i, simpleDcs);
	registerCommandRegex(/^\s*([a-z]+)\s*simple\s*dcs?\s*$/i, simpleDcs);
	registerCommandHelp("Command", "DCs", `simple dc PROFICIENCY`);
	registerCommandHelp("Command", "DCs", `PROFICIENCY simple dc`);

	registerCommandRegex(/^\s*dcs?\s*by\s*level\s*$/i, dcsByLevel);
	registerCommandRegex(/^\s*dc(?:\s*by)?\s*(spell)?\s*level\s*(\d+)(?:st|nd|rd|th)?\s*$/i, dcsByLevel);
	registerCommandHelp("Command", "DCs", `dcs by level`);
	registerCommandHelp("Command", "DCs", `dc by level LEVEL`);
	registerCommandHelp("Command", "DCs", `dc by spell level LEVEL`);
}
