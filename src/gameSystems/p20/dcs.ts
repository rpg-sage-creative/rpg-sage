import { parseEnum } from "@rsc-sage/types";
import { nth, type RenderableContent, type Snowflake } from "@rsc-utils/core-utils";
import { findComponent } from "@rsc-utils/discord-utils";
import { GameSystemType } from "@rsc-utils/game-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuOptionBuilder } from "discord.js";
import { registerListeners } from "../../sage-lib/discord/handlers/registerListeners.js";
import { createCommandRenderableContent } from "../../sage-lib/sage/commands/cmd.js";
import type { SageCommand } from "../../sage-lib/sage/model/SageCommand.js";
import type { SageStringSelectInteraction } from "../../sage-lib/sage/model/SageInteraction.js";
import { createMessageDeleteButton, createMessageDeleteButtonRow } from "../../sage-lib/sage/model/utils/deleteButton.js";
import { boundNumber, type BoundedOptions } from "../utils/boundNumber.js";
import { toModifier } from "../utils/toModifier.js";

type Table = "Simple" | "Level" | "Rank";
type Proficiency = "Untrained" | "Trained" | "Expert" | "Master" | "Legendary";
type Difficulty = "Incredibly Easy" | "Very Easy" | "Easy" | "Normal" | "Hard" | "Very Hard" | "Incredibly Hard";
type Rarity = "-" | "Common" | "Uncommon" | "Rare" | "Unique";
type Options = {
	difficulty?: Difficulty;
	gameSystemType: GameSystemType;
	level: number;
	rank: number;
	rarity?: Rarity;
	table: Table;
};

type SimpleItem = { proficiency:Proficiency; dc:number; };
function getSimpleTable(): SimpleItem[] {
	const rows: SimpleItem[] = [
		{ proficiency:"Untrained", dc:10 },
		{ proficiency:"Trained", dc:15 },
		{ proficiency:"Expert", dc:20 },
		{ proficiency:"Master", dc:30 },
		{ proficiency:"Legendary", dc:40 }
	];
	return rows;
}

type ByLevelItem = { level:number; dc:number; };
export function getByLevelTable(): ByLevelItem[];
export function getByLevelTable(level: number): ByLevelItem;
export function getByLevelTable(level?: number): ByLevelItem | ByLevelItem[] {
	const rows = [
		{ level:0, dc:14 },
		{ level:1, dc:15 },
		{ level:2, dc:16 },
		{ level:3, dc:18 },
		{ level:4, dc:19 },
		{ level:5, dc:20 },
		{ level:6, dc:22 },
		{ level:7, dc:23 },
		{ level:8, dc:24 },
		{ level:9, dc:26 },
		{ level:10, dc:27 },
		{ level:11, dc:28 },
		{ level:12, dc:30 },
		{ level:13, dc:31 },
		{ level:14, dc:32 },
		{ level:15, dc:34 },
		{ level:16, dc:35 },
		{ level:17, dc:36 },
		{ level:18, dc:38 },
		{ level:19, dc:39 },
		{ level:20, dc:40 },
		{ level:21, dc:42 },
		{ level:22, dc:44 },
		{ level:23, dc:46 },
		{ level:24, dc:48 },
		{ level:25, dc:50 }
	];
	if (typeof(level) === "number") {
		return rows.find(row => row.level === level)!;
	}
	return rows;
}

type ByRankItem = { rank:number; dc:number; };
function getByRankTable(): ByRankItem[];
function getByRankTable(rank: number): ByRankItem;
function getByRankTable(rank?: number): ByRankItem | ByRankItem[] {
	const rows = [
		{ rank:1, dc:15 },
		{ rank:2, dc:18 },
		{ rank:3, dc:20 },
		{ rank:4, dc:23 },
		{ rank:5, dc:26 },
		{ rank:6, dc:28 },
		{ rank:7, dc:31 },
		{ rank:8, dc:34 },
		{ rank:9, dc:36 },
		{ rank:10, dc:39 }
	];
	if (typeof(rank) === "number") {
		return rows.find(row => row.rank === rank)!;
	}
	return rows;
}

type AdjustmentItem = { difficulty:Difficulty; adjustment:number; rarity:Rarity; };
function getAdjustmentTable(): AdjustmentItem[] {
	const rows: AdjustmentItem[] = [
		{ difficulty:"Incredibly Easy", adjustment:-10, rarity:"-" },
		{ difficulty:"Very Easy", adjustment:-5, rarity:"-" },
		{ difficulty:"Easy", adjustment:-2, rarity:"-" },
		{ difficulty:"Normal", adjustment:0, rarity:"Common" },
		{ difficulty:"Hard", adjustment:2, rarity:"Uncommon" },
		{ difficulty:"Very Hard", adjustment:5, rarity:"Rare" },
		{ difficulty:"Incredibly Hard", adjustment:10, rarity:"Unique" }
	];
	return rows;
}

function adjustmentToString(row: AdjustmentItem, key: "difficulty" | "rarity"): string {
	return `${row[key]} (${toModifier(row.adjustment)})`;
}

/** Generates the renderable content for Character Wealth for the given system and level. */
function getContent(opts: Options): RenderableContent {
	const renderable = createCommandRenderableContent();
	if (opts.table === "Simple") {
		renderable.append(`## Simple DCs`);
		getSimpleTable().forEach(row => {
			renderable.append(`> ${row.proficiency} DC ${row.dc}`);
		});

	}else if (opts.table === "Level") {
		const dcRow = getByLevelTable(opts.level ?? 0);
		const diffRow = getAdjustmentTable().find(row => row.difficulty === (opts.difficulty ?? "Normal"))!;

		renderable.append(`## DC by Level: ${dcRow.level}`);
		renderable.append(`**Base**`, `> DC ${dcRow.dc}`);
		renderable.append(`**Difficulty**`, `> ${adjustmentToString(diffRow, "difficulty")}`);
		renderable.append(`**Final**`, `> DC ${dcRow.dc + (diffRow?.adjustment ?? 0)}`);

	}else {
		const dcRow = getByRankTable(opts.rank ?? 1);
		const rarityRow = getAdjustmentTable().find(row => row.rarity === (opts.rarity ?? "Common"))!;

		renderable.append(`## DC by Spell Rank: ${nth(dcRow.rank)}`);
		renderable.append(`**Base**`, `> DC ${dcRow.dc}`);
		renderable.append(`**Rarity**`, `> ${adjustmentToString(rarityRow, "rarity")}`);
		renderable.append(`**Final**`, `> DC ${dcRow.dc + (rarityRow?.adjustment ?? 0)}`);
	}
	return renderable;
}

/** Builds the form's components to be sent to the user. */
function buildForm(userId: Snowflake, selected: Options): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
	const tableSelect = new StringSelectMenuBuilder()
		.setCustomId(`p20-dcs-table`)
		.setPlaceholder(`Please Select DC Table ...`)
		.setOptions(
			new StringSelectMenuOptionBuilder().setLabel("Simple DCs").setValue("Simple").setDefault(selected.table === "Simple"),
			new StringSelectMenuOptionBuilder().setLabel("By Level").setValue("Level").setDefault(selected.table === "Level"),
			new StringSelectMenuOptionBuilder().setLabel("By Spell Rank").setValue("Rank").setDefault(selected.table === "Rank"),
		);

	if (selected.table === "Simple") {
		return [
			new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(tableSelect),
			createMessageDeleteButtonRow(userId, { label:"Delete" })
		];
	}

	if (selected.table === "Level") {
		const levelTable = getByLevelTable();
		const zero = levelTable[0];
		const levelSelect = new StringSelectMenuBuilder()
			.setCustomId(`p20-dcs-level`)
			.setPlaceholder(`Level ${zero.level} (DC ${zero.dc})`);
		levelTable.slice(1).forEach(row => {
			levelSelect.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(`Level ${row.level} (DC ${row.dc})`)
					.setValue(String(row.level))
					.setDefault(row.level === selected.level)
			);
		});

		const difficultySelect = new StringSelectMenuBuilder()
			.setCustomId(`p20-dcs-difficulty`)
			.setPlaceholder(`Optionally Select a Difficulty ...`);
		getAdjustmentTable().forEach(row => {
			difficultySelect.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(`${adjustmentToString(row, "difficulty")}`)
					.setValue(String(row.difficulty))
					.setDefault(row.difficulty === selected.difficulty)
			);
		});

		const resetButton = new ButtonBuilder()
			.setCustomId(`p20-dcs-reset`)
			.setLabel(`Reset`)
			.setStyle(ButtonStyle.Primary);

		const deleteButton = createMessageDeleteButton(userId, { label:"Delete" });

		return [
			new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(tableSelect),
			new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(levelSelect),
			new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(difficultySelect),
			new ActionRowBuilder<ButtonBuilder>().setComponents(resetButton, deleteButton)
		];
	}

	const rankSelect = new StringSelectMenuBuilder()
		.setCustomId(`p20-dcs-rank`)
		.setPlaceholder(`Please Select a Spell Rank (1-10) ...`);
	getByRankTable().forEach(row => {
		rankSelect.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`Spell Rank ${nth(row.rank)} (DC ${row.dc})`)
				.setValue(String(row.rank))
				.setDefault(row.rank === (selected.rank ?? 1))
		);
	});

	const raritySelect = new StringSelectMenuBuilder()
		.setCustomId(`p20-dcs-rarity`)
		.setPlaceholder(`Optionally Select a Rarity ...`);
	getAdjustmentTable().forEach(row => {
		if (row.rarity !== "-") {
			raritySelect.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(`${adjustmentToString(row, "rarity")}`)
					.setValue(String(row.rarity))
					.setDefault(row.rarity === selected.rarity)
			);
		}
	});

	const resetButton = new ButtonBuilder()
		.setCustomId(`p20-dcs-reset`)
		.setLabel(`Reset`)
		.setStyle(ButtonStyle.Primary);

	const deleteButton = createMessageDeleteButton(userId, { label:"Delete" });

	return [
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(tableSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(rankSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(raritySelect),
		new ActionRowBuilder<ButtonBuilder>().setComponents(resetButton, deleteButton)
	];
}

/** Sends the initial reply to the user. */
async function showDCs(sageCommand: SageCommand): Promise<void> {
	const gameSystemType = sageCommand.gameSystemType ?? sageCommand.args.getEnum(GameSystemType, "game") ?? GameSystemType.PF2e;
	const table = ["Simple", "Level", "Rank"].find(table => table === sageCommand.args.getString("table")) as Table ?? "Simple";
	const level = boundNumber(sageCommand.args.getNumber("level"), { min:0, max:25, default:0 });
	const rank = boundNumber(sageCommand.args.getNumber("rank"), { min:1, max:10, default:1 });
	const difficulty = getAdjustmentTable().find(row => row.difficulty === sageCommand.args.getString("difficulty"))?.difficulty;
	const rarity = getAdjustmentTable().find(row => row.rarity === sageCommand.args.getString("rarity"))?.rarity;
	const options = { gameSystemType, table, level, rank, difficulty, rarity };
	const content = getContent(options);
	const components = buildForm(sageCommand.actorId, options);
	await sageCommand.replyStack.reply({ content, components });
}

/** Gets the selected value (updated or default) for the given customId. */
function getSelected<T extends string = string>(sageInteraction: SageStringSelectInteraction, customId: string): T | undefined;
function getSelected(sageInteraction: SageStringSelectInteraction, customId: string, boundOpts: BoundedOptions): number;
function getSelected(sageInteraction: SageStringSelectInteraction, customId: string, boundOpts?: BoundedOptions): string | number | undefined {
	const ret = boundOpts
		? (value: string) => boundNumber(+value, boundOpts)
		: (value: string) => value;
	if (sageInteraction.customIdMatches(customId)) {
		return ret(sageInteraction.interaction.values[0]);
	}
	const component = findComponent(sageInteraction.interaction.message, customId);
	if (component) {
		for (const option of (component as StringSelectMenuComponent).options) {
			if (option.default) {
				return ret(option.value);
			}
		}
	}
	return undefined;
}

/** Updates the form when a system or level is changed. */
async function changeDCs(sageInteraction: SageStringSelectInteraction): Promise<void> {
	sageInteraction.replyStack.defer();
	const isReset = sageInteraction.customIdMatches(`p20-dcs-reset`);
	const gameSystemType = parseEnum(GameSystemType, getSelected(sageInteraction, "p20-dcs-game") ?? "PF2e");
	const table = getSelected<Table>(sageInteraction, "p20-dcs-table") ?? "Simple";
	const level = isReset ? 0 : getSelected(sageInteraction, "p20-dcs-level", { min:0, max:25, default:0 });
	const rank = isReset ? 1 : getSelected(sageInteraction, "p20-dcs-rank", { min:1, max:10, default:1 });
	const difficulty = isReset ? undefined : getSelected<Difficulty>(sageInteraction, "p20-dcs-difficulty");
	const rarity = isReset ? undefined : getSelected<Rarity>(sageInteraction, "p20-dcs-rarity");
	const options = { gameSystemType, table, level, rank, difficulty, rarity };
	const content = getContent(options);
	const components = buildForm(sageInteraction.actorId, options);
	await sageInteraction.interaction.message.edit(sageInteraction.resolveToOptions({ content, components }));
}

export function registerDCs(): void {
	registerListeners({ commands:["PF2E|DCs", "SF2E|DCs", "Finder|DCs", "P20|DCs"], handler:showDCs });
	registerListeners({ commands:["p20-dcs-game", "p20-dcs-table", "p20-dcs-level", "p20-dcs-rank", "p20-dcs-difficulty", "p20-dcs-rarity", `p20-dcs-reset`], interaction:changeDCs });

}