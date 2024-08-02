import { GameSystemType, getGameSystems, parseEnum } from "@rsc-sage/types";
import { addCommas, nth } from "@rsc-utils/number-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js";
import { registerListeners } from "../../sage-lib/discord/handlers/registerListeners.js";
import { createCommandRenderableContent } from "../../sage-lib/sage/commands/cmd.js";
import type { SageCommand } from "../../sage-lib/sage/model/SageCommand.js";
import type { SageInteraction } from "../../sage-lib/sage/model/SageInteraction.js";
import { createMessageDeleteButtonRow } from "../../sage-lib/sage/model/utils/deleteButton.js";
import type { Snowflake } from "@rsc-utils/core-utils";

/** Creates and formats the Character Wealth table for the given system. */
function getWealthTable(gameSystemType: GameSystemType) {
	const rows = [
		{ level:1, items:"-", currency:15, lump:15 },
		{ level:2, items:"1st: 1", currency:20, lump:30 },
		{ level:3, items:"2nd: 1, 1st: 2", currency:25, lump:75 },
		{ level:4, items:"3rd: 1, 2nd: 2, 1st: 1", currency:30, lump:140 },
		{ level:5, items:"4th: 1, 3rd: 2, 2nd: 1, 1st: 2", currency:50, lump:270 },
		{ level:6, items:"5th: 1, 4th: 2, 3rd: 1, 2nd: 2", currency:80, lump:450 },
		{ level:7, items:"6th: 1, 5th: 2, 4th: 1, 3rd: 2", currency:125, lump:720 },
		{ level:8, items:"7th: 1, 6th: 2, 5th: 1, 4th: 2", currency:180, lump:1100 },
		{ level:9, items:"8th: 1, 7th: 2, 6th: 1, 5th: 2", currency:250, lump:1600 },
		{ level:10, items:"9th: 1, 8th: 2, 7th: 1, 6th: 2", currency:350, lump:2300 },
		{ level:11, items:"10th: 1, 9th: 2, 8th: 1, 7th: 2", currency:500, lump:3200 },
		{ level:12, items:"11th: 1, 10th: 2, 9th: 1, 8th: 2", currency:700, lump:4500 },
		{ level:13, items:"12th: 1, 11th: 2, 10th: 1, 9th: 2", currency:1000, lump:6400 },
		{ level:14, items:"13th: 1, 12th: 2, 11th: 1, 10th: 2", currency:1500, lump:9300 },
		{ level:15, items:"14th: 1, 13th: 2, 12th: 1, 11th: 2", currency:2250, lump:13500 },
		{ level:16, items:"15th: 1, 14th: 2, 13th: 1, 12th: 2", currency:3250, lump:20000 },
		{ level:17, items:"16th: 1, 15th: 2, 14th: 1, 13th: 2", currency:5000, lump:30000 },
		{ level:18, items:"17th: 1, 16th: 2, 15th: 1, 14th: 2", currency:7500, lump:45000 },
		{ level:19, items:"18th: 1, 17th: 2, 16th: 1, 15th: 2", currency:12000, lump:69000 },
		{ level:20, items:"19th: 1, 18th: 2, 17th: 1, 16th: 2", currency:20000, lump:11200 }
	];
	const curr = gameSystemType === GameSystemType.PF2e
		? (value: number) => `${addCommas(value)} gp`
		: (value: number) => `${addCommas(value * 10)} credits`;
	return rows.map(row => {
		return {
			level: nth(row.level),
			items: row.items,
			currency: curr(row.currency),
			lump: curr(row.lump)
		};
	});
}

/** Generates the renderable content for Character Wealth for the given system and level. */
function getWealthByLevel({ gameSystemType, level }: { gameSystemType: GameSystemType, level: number }): RenderableContent {
	const renderable = createCommandRenderableContent();
	const row = getWealthTable(gameSystemType)[level - 1];
	renderable.append(`<h2>Character Wealth (${nth(level)} Level)</h2>`);
	renderable.append(`<b>Permanent Items</b>`, `<blockquote>${row.items.split(/,\s*/).join("\n")}</blockquote>`);
	renderable.append(`<b>Currency</b>`, `<blockquote>${row.currency}</blockquote>`)
	renderable.append("");
	renderable.append(`<i>or</i>`);
	renderable.append(`<b>Lump Sum</b>`, `<blockquote>${row.lump}</blockquote>`)
	return renderable;
}

/** Builds the form's components to be sent to the user. */
function buildForm(userId: Snowflake, selected: { gameSystemType: GameSystemType, level: number }): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
	const gameSelect = new StringSelectMenuBuilder()
		.setCustomId(`p20-wealth-game`)
		.setPlaceholder(`Please Select a Game System ...`);
	getGameSystems().forEach(gameSystem => {
		if ([GameSystemType.PF2e, GameSystemType.SF2e].includes(gameSystem.type)) {
			gameSelect.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(gameSystem.name)
					.setValue(gameSystem.code)
					.setDefault(gameSystem.type === selected.gameSystemType)
			);
		}
	});

	const levelSelect = new StringSelectMenuBuilder()
		.setCustomId(`p20-wealth-level`)
		.setPlaceholder(`Please Select a Level ...`);
	for (let level = 1; level <= 20; level++) {
		levelSelect.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`${nth(level)} Level`)
				.setValue(String(level))
				.setDefault(level === selected.level)
		);
	}

	return [
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(gameSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(levelSelect),
		createMessageDeleteButtonRow(userId, { label:"Remove Character Wealth Control" })
	];
}

/** Sends the initial reply to the user. */
async function showWealth(sageCommand: SageCommand): Promise<void> {
	const levelArg = sageCommand.args.getNumber("level") ?? 1;
	const level = Math.min(20, Math.max(1, levelArg));
	const gameSystemType = sageCommand.gameSystemType ?? sageCommand.args.getEnum(GameSystemType, "game") ?? GameSystemType.PF2e;
	const content = getWealthByLevel({ gameSystemType, level });
	const components = buildForm(sageCommand.authorDid, { gameSystemType, level });
	await sageCommand.replyStack.reply({ content, components });
}

/** Gets the selected value (updated or default) for the given customId. */
function getSelected(sageInteraction: SageInteraction<StringSelectMenuInteraction>, customId: string): string | undefined {
	if (sageInteraction.customIdMatches(customId)) {
		return sageInteraction.interaction.values[0];
	}
	for (const row of sageInteraction.interaction.message.components) {
		for (const component of row.components) {
			if (component.customId === customId) {
				for (const option of (component as StringSelectMenuComponent).options) {
					if (option.default) {
						return option.value;
					}
				}
			}
		}
	}
	return undefined;
}

/** Updates the form when a system or level is changed. */
async function changeWealth(sageInteraction: SageInteraction<StringSelectMenuInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();
	const levelArg = +(getSelected(sageInteraction, "p20-wealth-level") ?? 1);
	const level = Math.min(20, Math.max(1, levelArg));
	const gameSystemType = parseEnum(GameSystemType, getSelected(sageInteraction, "p20-wealth-game") ?? "PF2e");
	const content = getWealthByLevel({ gameSystemType, level });
	const components = buildForm(sageInteraction.authorDid, { gameSystemType, level });
	const options = sageInteraction.resolveToOptions({ content, components });
	await sageInteraction.interaction.message.edit(options);
}

export function registerCharacterWealth(): void {
	registerListeners({ commands:["character|wealth", "starting|wealth"], handler:showWealth });
	registerListeners({ commands:["p20-wealth-game", "p20-wealth-level"], interaction:changeWealth });
}