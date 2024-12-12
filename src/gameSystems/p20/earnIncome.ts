import { GameSystemType, parseGameSystem } from "@rsc-sage/types";
import { type Snowflake } from "@rsc-utils/core-utils";
import { addCommas, nth } from "@rsc-utils/number-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js";
import { Dice } from "../../sage-dice/dice/pf2e/index.js";
import { DieRollGrade } from "../../sage-dice/index.js";
import { registerListeners } from "../../sage-lib/discord/handlers/registerListeners.js";
import { createCommandRenderableContent } from "../../sage-lib/sage/commands/cmd.js";
import type { SageCommand } from "../../sage-lib/sage/model/SageCommand.js";
import { SageInteraction } from "../../sage-lib/sage/model/SageInteraction.js";
import { createMessageDeleteButton } from "../../sage-lib/sage/model/utils/deleteButton.js";
import { Coins } from "../../sage-pf2e/index.js";
import { boundNumber } from "../utils/boundNumber.js";
import { toModifier } from "../utils/toModifier.js";
import { getByLevelTable } from "./dcs.js";
import { getSelectedOrDefault, getSelectedOrDefaultEnum, getSelectedOrDefaultNumber } from "./lib/getSelectedOrDefault.js";
import { getPaizoGameSystems } from "./lib/PaizoGameSystem.js";
import type { ProficiencyName } from "./lib/Proficiency.js";
import { ProficiencyType } from "./lib/types.js";

type Control = "gameSystem" | "taskLevel" | "charLevel" | "proficiency" | "modifier" | `rollCheck`;
function createCustomId(control: Control, userId: Snowflake): `p20|earnIncome|${Control}|${Snowflake}` {
	return `p20|earnIncome|${control}|${userId}`;
}
function getUserId(customId: string): Snowflake {
	return customId.split("|").pop() as Snowflake;
}

type RawEarnIncomeItem = { level:number; failure:string; trained:string; expert:string; master:string; legendary:string; };

function getEarnIncomeTablePf2e(): RawEarnIncomeItem[] {
	return [
		{ level:0, failure:"1 cp", trained:"5 cp", expert:"5 cp", master:"5 cp", legendary:"5 cp" },
		{ level:1, failure:"2 cp", trained:"2 sp", expert:"2 sp", master:"2 sp", legendary:"2 sp" },
		{ level:2, failure:"4 cp", trained:"3 sp", expert:"3 sp", master:"3 sp", legendary:"3 sp" },
		{ level:3, failure:"8 cp", trained:"5 sp", expert:"5 sp", master:"5 sp", legendary:"5 sp" },
		{ level:4, failure:"1 sp", trained:"7 sp", expert:"8 sp", master:"8 sp", legendary:"8 sp" },
		{ level:5, failure:"2 sp", trained:"9 sp", expert:"1 gp", master:"1 gp", legendary:"1 gp" },
		{ level:6, failure:"3 sp", trained:"1 gp, 5 sp", expert:"2 gp", master:"2 gp", legendary:"2 gp" },
		{ level:7, failure:"4 sp", trained:"2 gp", expert:"2 gp, 5 sp", master:"2 gp, 5 sp", legendary:"2 gp, 5 sp" },
		{ level:8, failure:"5 sp", trained:"2 gp, 5 sp", expert:"3 gp", master:"3 gp", legendary:"3 gp" },
		{ level:9, failure:"6 sp", trained:"3 gp", expert:"4 gp", master:"4 gp", legendary:"4 gp" },
		{ level:10, failure:"7 sp", trained:"4 gp", expert:"5 gp", master:"6 gp", legendary:"6 gp" },
		{ level:11, failure:"8 sp", trained:"5 gp", expert:"6 gp", master:"8 gp", legendary:"8 gp" },
		{ level:12, failure:"9 sp", trained:"6 gp", expert:"8 gp", master:"10 gp", legendary:"10 gp" },
		{ level:13, failure:"1 gp", trained:"7 gp", expert:"10 gp", master:"15 gp", legendary:"15 gp" },
		{ level:14, failure:"1 gp, 5 sp", trained:"8 gp", expert:"15 gp", master:"20 gp", legendary:"20 gp" },
		{ level:15, failure:"2 gp", trained:"10 gp", expert:"20 gp", master:"28 gp", legendary:"28 gp" },
		{ level:16, failure:"2 gp, 5 sp", trained:"13 gp", expert:"25 gp", master:"36 gp", legendary:"40 gp" },
		{ level:17, failure:"3 gp", trained:"15 gp", expert:"30 gp", master:"45 gp", legendary:"55 gp" },
		{ level:18, failure:"4 gp", trained:"20 gp", expert:"45 gp", master:"70 gp", legendary:"90 gp" },
		{ level:19, failure:"6 gp", trained:"30 gp", expert:"60 gp", master:"100 gp", legendary:"130 gp" },
		{ level:20, failure:"8 gp", trained:"40 gp", expert:"75 gp", master:"150 gp", legendary:"200 gp" },
		{ level:21, failure:"-", trained:"50 gp", expert:"90 gp", master:"175 gp", legendary:"300 gp" }
	];
}
function getEarnIncomeTableSf2e(): RawEarnIncomeItem[] {
	return [
		{ level:0, failure:"0.1 credit", trained:"0.5 credit", expert:"0.5 credit", master:"0.5 credit", legendary:"0.5 credit" },
		{ level:1, failure:"0.2 credit", trained:"2 credits", expert:"2 credits", master:"2 credits", legendary:"2 credits" },
		{ level:2, failure:"0.4 credit", trained:"3 credits", expert:"3 credits", master:"3 credits", legendary:"3 credits" },
		{ level:3, failure:"0.8 credit", trained:"5 credits", expert:"5 credits", master:"5 credits", legendary:"5 credits" },
		{ level:4, failure:"1 credit", trained:"7 credits", expert:"8 credits", master:"8 credits", legendary:"8 credits" },
		{ level:5, failure:"2 credits", trained:"9 credits", expert:"10 credits", master:"10 credits", legendary:"10 credits" },
		{ level:6, failure:"3 credits", trained:"15 credits", expert:"20 credits", master:"20 credits", legendary:"20 credits" },
		{ level:7, failure:"4 credits", trained:"20 credits", expert:"25 credits", master:"25 credits", legendary:"25 credits" },
		{ level:8, failure:"5 credits", trained:"25 credits", expert:"30 credits", master:"30 credits", legendary:"30 credits" },
		{ level:9, failure:"6 credits", trained:"30 credits", expert:"40 credits", master:"40 credits", legendary:"40 credits" },
		{ level:10, failure:"7 credits", trained:"40 credits", expert:"50 credits", master:"60 credits", legendary:"60 credits" },
		{ level:11, failure:"8 credits", trained:"50 credits", expert:"60 credits", master:"80 credits", legendary:"80 credits" },
		{ level:12, failure:"9 credits", trained:"60 credits", expert:"80 credits", master:"100 credits", legendary:"100 credits" },
		{ level:13, failure:"10 credits", trained:"70 credits", expert:"100 credits", master:"150 credits", legendary:"150 credits" },
		{ level:14, failure:"15 credits", trained:"80 credits", expert:"150 credits", master:"200 credits", legendary:"200 credits" },
		{ level:15, failure:"20 credits", trained:"100 credits", expert:"200 credits", master:"280 credits", legendary:"280 credits" },
		{ level:16, failure:"25 credits", trained:"130 credits", expert:"250 credits", master:"360 credits", legendary:"400 credits" },
		{ level:17, failure:"30 credits", trained:"150 credits", expert:"300 credits", master:"450 credits", legendary:"550 credits" },
		{ level:18, failure:"40 credits", trained:"200 credits", expert:"450 credits", master:"700 credits", legendary:"900 credits" },
		{ level:19, failure:"60 credits", trained:"300 credits", expert:"600 credits", master:"1000 credits", legendary:"1,300 credits" },
		{ level:20, failure:"80 credits", trained:"400 credits", expert:"750 credits", master:"1500 credits", legendary:"2,000 credits" },
		{ level:21, failure:"-", trained:"500 credits", expert:"900 credits", master:"1,750 credits", legendary:"3,000 credits" }
	];
}

function getEarnIncomeTable(gameSystem: GameSystemType) {
	const raw = gameSystem === GameSystemType.SF2e ? getEarnIncomeTableSf2e() : getEarnIncomeTablePf2e();
	const dcs = getByLevelTable();
	return raw.map((item, index) => ({ ...item, dc:dcs[index].dc }));
}

/*
PFS Downtime Rules (PF2e)

2 days of downtime per XP earned
- scenario: 4xp = 8 days
- quest: 2xp = 4 days
- bounty: NONE
- other: AS LISTED

Spend downtime 8 days at a time (if 8 or more days are available for downtime)

Crit Success uses task level + 1 result

Mostly Crafting, Performance, Lore
*/

function createGameSystemSelect(userId: Snowflake, selected?: GameSystemType): StringSelectMenuBuilder {
	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId("gameSystem", userId))
		.setPlaceholder(`Please Select a Game System ...`);
	getPaizoGameSystems().forEach(gameSystem => {
		if (gameSystem.is2e) {
			selectBuilder.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(gameSystem.name)
					.setValue(gameSystem.code)
					.setDefault(gameSystem.type === selected || (!selected && gameSystem.isPf && gameSystem.is2e))
			);
		}
	});
	return selectBuilder;
}

function createTaskLevelSelect(userId: Snowflake, gameSystem: GameSystemType, selected?: number): StringSelectMenuBuilder {
	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId("taskLevel", userId))
		.setPlaceholder(`Please Select a Task Level ...`);
	getEarnIncomeTable(gameSystem).forEach(task =>
		selectBuilder.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`Task Level: ${task.level}`)
				.setValue(`${task.level}`)
				.setDefault(task.level === selected || (selected === undefined && task.level === 0))
		)
	);
	return selectBuilder;
}

function createCharLevelSelect(userId: Snowflake, selected?: number): StringSelectMenuBuilder {
	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId("charLevel", userId))
		.setPlaceholder(`Please Select a Character Level ...`);
	for (let level = 1; level < 21; level++) {
		selectBuilder.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`Character Level: ${nth(level)}`)
				.setValue(`${level}`)
				.setDefault(level === selected || (selected === undefined && level === 1))
		);
	}
	return selectBuilder;
}

function createProficiencySelect(userId: Snowflake, selected?: ProficiencyName): StringSelectMenuBuilder {
	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId("proficiency", userId))
		.setPlaceholder(`Please Select a Proficiency ...`);
	["Trained", "Expert", "Master", "Legendary"].forEach(proficiencyName => {
		selectBuilder.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`Proficiency: ${proficiencyName}`)
				.setValue(proficiencyName)
				.setDefault(proficiencyName === selected)
				// .setDefault(proficiencyName === selected || (selected === undefined && proficiencyName === "Trained"))
		);
	});
	return selectBuilder;
}

function createModifierSelect(selected: Args): StringSelectMenuBuilder {
	const minLevel = ({ Trained:1, Expert:2, Master:7, Legendary:15 })[selected.proficiency as "Trained"] ?? 1;
	const level = selected.byCharLevel ? selected.charLevel : minLevel;
	const minStat = -1;
	const maxStat = +6;
	const minModifier = level + ProficiencyType[selected.proficiency] + minStat;
	const maxModifier = minModifier + 10 + (maxStat - minStat);

	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId("modifier", selected.userId))
		.setPlaceholder(`Please Select a Modifier ...`);
	for (let modifier = minModifier; modifier <= maxModifier; modifier++) {
		selectBuilder.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`Modifier: +${modifier}`)
				.setValue(String(modifier))
				.setDefault(modifier === selected.modifier || (selected.modifier === undefined && modifier === minModifier))
		);
	}
	return selectBuilder;
}

function createButtonRow(userId: Snowflake): ActionRowBuilder<ButtonBuilder> {
	const rollButton = new ButtonBuilder()
		.setCustomId(createCustomId(`rollCheck`, userId))
		.setLabel(`Roll Check`)
		.setStyle(ButtonStyle.Primary);
	return new ActionRowBuilder<ButtonBuilder>().setComponents(
		rollButton,
		createMessageDeleteButton(userId, { label:"Delete" })
	);
}

/** Builds the form's components to be sent to the user. */
function buildTaskForm(args: Args): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
	const gameSystemSelect = createGameSystemSelect(args.userId, args.gameSystemType);
	const taskLevelSelect = createTaskLevelSelect(args.userId, args.gameSystemType, args.taskLevel);
	const proficiencySelect = createProficiencySelect(args.userId, args.proficiency);
	const modifierSelect = createModifierSelect(args);

	return [
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(gameSystemSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(taskLevelSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(proficiencySelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(modifierSelect),
		createButtonRow(args.userId)
	];
}

/** Builds the form's components to be sent to the user. */
function buildCharForm(args: Args): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
	const gameSystemSelect = createGameSystemSelect(args.userId, args.gameSystemType);
	const charLevelSelect = createCharLevelSelect(args.userId, args.charLevel);
	const proficiencySelect = createProficiencySelect(args.userId, args.proficiency);
	const modifierSelect = createModifierSelect(args);

	return [
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(gameSystemSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(charLevelSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(proficiencySelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(modifierSelect),
		createButtonRow(args.userId)
	];
}

const resultsTexts = [
	,
	`You earn nothing for your work and are fired immediately. You can’t continue at the task. Your reputation suffers, potentially making it difficult for you to find rewarding jobs in that community in the future.`,
	`You do shoddy work and get paid the bare minimum for your time. Gain the amount of currency listed in the failure column for the task level. The GM will likely reduce how long you can continue at the task.`,
	`You do competent work. Gain the amount of currency listed for the task level and your proficiency rank.`,
	`You do outstanding work. Gain the amount of currency listed for the task level + 1 and your proficiency rank.`,
];

export function getEarnIncomeByTaskLevel(selected: Args): RenderableContent {
	const taskTable = getEarnIncomeTable(selected.gameSystemType);
	const taskItem = taskTable[selected.taskLevel];
	const criticalSuccessTaskItem = taskTable[selected.taskLevel + 1];

	const renderable = createCommandRenderableContent();
	renderable.append(`<h2>Earn Income</h2>`);
	renderable.appendBlock(
		parseGameSystem(selected.gameSystemType)?.name ?? "Pathfinder 2e"
	);
	if (selected.byCharLevel) {
		renderable.appendBlock(
			`Character Level ${selected.charLevel}`,
		);
	}
	renderable.appendBlock(
		`Task Level ${selected.taskLevel}`,
	);
	renderable.append(`<b>DC</b>`);
	renderable.appendBlock(
		String(taskItem.dc)
	);
	renderable.append(`<b>Critical Success</b>`);
	renderable.appendBlock(
		resultsTexts[DieRollGrade.CriticalSuccess]!,
		`<b>Income Earned</b> Trained: ${criticalSuccessTaskItem.trained}, Expert: ${criticalSuccessTaskItem.expert}, Master: ${criticalSuccessTaskItem.master}, Legendary: ${criticalSuccessTaskItem.legendary}`
	);
	renderable.append(`<b>Success</b>`);
	renderable.appendBlock(
		resultsTexts[DieRollGrade.Success]!,
		`<b>Income Earned</b> Trained: ${taskItem.trained}, Expert: ${taskItem.expert}, Master: ${taskItem.master}, Legendary: ${taskItem.legendary}`
	);
	renderable.append(`<b>Failure</b>`);
	renderable.appendBlock(
		resultsTexts[DieRollGrade.Failure]!,
		`<b>Income Earned</b> ${taskItem.failure}`
	);
	renderable.append(`<b>Critical Failure</b>`);
	renderable.appendBlock(
		resultsTexts[DieRollGrade.CriticalFailure]!,
	);
	return renderable;
}

type Args = {
	byCharLevel: boolean;
	charLevelArg?: number;
	charLevel: number;
	gameSystemType: GameSystemType;
	modifier?: number;
	proficiency: ProficiencyName;
	taskLevelArg?: number;
	taskLevel: number;
	userId: Snowflake;
};

function getArgs(sageCommand: SageCommand): Args {
	const userId = sageCommand.isSageInteraction("BUTTON") || sageCommand.isSageInteraction("SELECT") ? getUserId(sageCommand.interaction.customId) : sageCommand.authorDid;
	const taskLevelArg = getSelectedOrDefaultNumber(sageCommand, createCustomId("taskLevel", userId), "taskLevel");
	const charLevelArg = getSelectedOrDefaultNumber(sageCommand, createCustomId("charLevel", userId), "charLevel");
	const modifier = getSelectedOrDefaultNumber(sageCommand, createCustomId("modifier", userId), "modifier");
	const proficiency = getSelectedOrDefault(sageCommand, createCustomId("proficiency", userId)) as ProficiencyName ?? "Trained";
	const gameSystemType = getSelectedOrDefaultEnum<GameSystemType>(sageCommand, GameSystemType, createCustomId("gameSystem", userId), "game") ?? sageCommand.gameSystemType ?? GameSystemType.PF2e;
	const byCharLevel = !!charLevelArg;
	const charLevel = boundNumber(+(charLevelArg ?? 1), { min:1, max:20, default:1 });
	const taskLevel = charLevelArg
		? charLevel - 2
		: boundNumber(+(taskLevelArg ?? 1), { min:0, max:20, default:1 });
	return { taskLevelArg, charLevelArg, gameSystemType, byCharLevel, charLevel, taskLevel, proficiency, modifier, userId };
}

async function showEarnIncome(sageCommand: SageCommand): Promise<void> {
	const args = getArgs(sageCommand);
	const content = getEarnIncomeByTaskLevel(args);
	const components = args.byCharLevel
		? buildCharForm(args)
		: buildTaskForm(args);
	await sageCommand.replyStack.reply({ content, components });
}

async function changeEarnIncome(sageInteraction: SageInteraction<StringSelectMenuInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();
	const args = getArgs(sageInteraction);
	const content = getEarnIncomeByTaskLevel(args);
	const components = args.byCharLevel
		? buildCharForm(args)
		: buildTaskForm(args);
	const options = sageInteraction.resolveToOptions({ content, components });
	await sageInteraction.interaction.message.edit(options);
}

function multiplyIncome(incomePerDay: string, days: number): string {
	if (incomePerDay.includes("credits")) {
		const credits = +incomePerDay.replace(/[^\d\.]/g, "");
		return `${addCommas(credits * days)} credits`;
	}
	return Coins.parse(incomePerDay).multiply(days).toGpString();
}

async function rollEarnIncome(sageInteraction: SageInteraction<ButtonInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();
	const args = getArgs(sageInteraction);
	const modifier = args.modifier ? toModifier(args.modifier) : "";
	const taskTable = getEarnIncomeTable(args.gameSystemType);
	const taskItem = taskTable[args.taskLevel];
	const criticalSuccessTaskItem = taskTable[args.taskLevel + 1];
	const dc = taskItem.dc;

	const diceString = `[1d20 ${modifier} DC ${dc}]`;
	const dice = Dice.parse(diceString.slice(1, -1));
	const roll = dice.roll();
	const isCrit = roll.grade === DieRollGrade.CriticalFailure || roll.grade === DieRollGrade.CriticalSuccess;
	const isSuccess = roll.grade === DieRollGrade.Success || roll.grade === DieRollGrade.CriticalSuccess;
	const incomePerDay = isCrit && isSuccess ? criticalSuccessTaskItem[args.proficiency.toLowerCase() as "trained"]
		: isSuccess ? taskItem[args.proficiency.toLowerCase() as "trained"]
		: !isSuccess && !isCrit ? taskItem.failure
		: args.gameSystemType === GameSystemType.SF2e ? "0 credits"
		: "0 sp";

	const renderable = createCommandRenderableContent();
	renderable.append(`<b>Earn Income</b>`);
	renderable.appendBlock(
		parseGameSystem(args.gameSystemType)?.name ?? "Pathfinder 2e"
	);
	if (args.byCharLevel) {
		renderable.appendBlock(
			`Character Level ${args.charLevel}`,
		);
	}
	renderable.appendBlock(
		`Task Level ${args.taskLevel}`,
	);
	renderable.append(`<b>Check</b>`);
	renderable.appendBlock(
		diceString
	);
	renderable.append(`<b>Check Result</b>`);
	renderable.appendBlock(
		`<b>${roll.rolls[0].rolls[0]}</b> ${toModifier(args.modifier??0)} = ${roll.total}`,
	);
	renderable.append(`<b>${isCrit ? "Critical " : ""}${isSuccess ? "Success" : "Failure"}</b>`);
	renderable.appendBlock(
		resultsTexts[roll.grade]!
	);
	renderable.append(`<b>Income Earned Per Day</b>`);
	renderable.appendBlock(
		incomePerDay
	);
	renderable.append(`<b>Common PFS Increments</b>`);
	renderable.appendBlock(
		`<b>2 days</b> ${multiplyIncome(incomePerDay, 2)}`,
		`<b>3 days</b> ${multiplyIncome(incomePerDay, 3)}`,
		`<b>4 days</b> ${multiplyIncome(incomePerDay, 4)}`,
		`<b>6 days</b> ${multiplyIncome(incomePerDay, 6)}`,
		`<b>8 days</b> ${multiplyIncome(incomePerDay, 8)}`,
		`<b>12 days</b> ${multiplyIncome(incomePerDay, 12)}`,
		`<b>24 days</b> ${multiplyIncome(incomePerDay, 24)}`,
		`<b>36 days</b> ${multiplyIncome(incomePerDay, 36)}`,
	);
	await sageInteraction.send(renderable);
}

export function registerEarnIncome(): void {
	registerListeners({ commands:["earn|income", "income|earned"], handler:showEarnIncome });
	registerListeners({ commands:[/p20\|earnIncome\|(gameSystem|taskLevel|charLevel|proficiency|modifier)\|\d{16,}/], interaction:changeEarnIncome });
	registerListeners({ commands:[/p20\|earnIncome\|rollCheck\|\d{16,}/], interaction:rollEarnIncome });
}