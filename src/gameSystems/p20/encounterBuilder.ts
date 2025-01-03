import { GameSystemType, parseGameSystem } from "@rsc-sage/types";
import { debug, warn, type Snowflake } from "@rsc-utils/core-utils";
import { ActionRowBuilder, ButtonBuilder, Message, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js";
import { registerListeners } from "../../sage-lib/discord/handlers/registerListeners";
import type { SageCommand } from "../../sage-lib/sage/model/SageCommand";
import { getPaizoGameSystems } from "./lib/PaizoGameSystem";
import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import { deleteMessage } from "../../sage-lib/discord/deletedMessages";
import { getSelectedOrDefaultEnum, getSelectedOrDefaultNumber } from "./lib/getSelectedOrDefault";
import { createMessageDeleteButton } from "../../sage-lib/sage/model/utils/deleteButton";
import type { SageInteraction } from "../../sage-lib/sage/model/SageInteraction";
import { createCommandRenderableContent } from "../../sage-lib/sage/commands/cmd";
import type { RenderableContent } from "@rsc-utils/render-utils";

type CustomIdArgsBase<GameSystem extends string, FormId extends string, Control extends string> = {
	/** What gameSystem is selected? */
	gameSystem: GameSystem;
	/** What form are we displaying? */
	form: FormId;
	/** What user are we working for? */
	userId: Snowflake;
	/** What messages are we using for the controls? */
	messageIds: Snowflake[];
	/** What control are we working with? */
	control: Control;
};

type Control = "gameSystem" | "partyLevel" | "partySize" | "addCreature" | "simpleHazard" | "complexHazard" | "removeItem" | "deleteForm";

type CustomIdArgs<ControlArg extends Control> = CustomIdArgsBase<"p20", "encounterBuilder", ControlArg> & {
	complexHazards: number[];
	creatures: number[];
	simpleHazards: number[];
};

function createCustomId<ControlArg extends Control>(args: CustomIdArgs<ControlArg>, control?: Control): string {
	return `p20|encounterBuilder|${args.userId}|${args.messageIds.join("-")}|${control ?? args.control}`;
}
function parseCustomId<ControlArg extends Control>(customId: string): CustomIdArgs<ControlArg> {
	const [ gameSystem, form, userId, messageIds, control, ...threats ] = customId.split("|");
	const creatures = threats.filter(s => s.startsWith("cr")).map(cr => +cr.slice(2));
	const complexHazards = threats.filter(s => s.startsWith("ch")).map(ch => +ch.slice(2));
	const simpleHazards = threats.filter(s => s.startsWith("sh")).map(sh => +sh.slice(2));
	return {
		gameSystem: gameSystem as "p20",
		form: form as "encounterBuilder",
		userId: userId as Snowflake,
		messageIds: messageIds.split("-") as Snowflake[],
		control: control as ControlArg,
		creatures,
		complexHazards,
		simpleHazards,
	};
}

function createGameSystemSelect<ControlArg extends Control>(args: CustomIdArgs<ControlArg>, selected?: GameSystemType): StringSelectMenuBuilder {
	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId(args, "gameSystem"))
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

function createPartyLevelSelect<ControlArg extends Control>(args: CustomIdArgs<ControlArg>, selected?: number): StringSelectMenuBuilder {
	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId(args, "partyLevel"))
		.setPlaceholder(`Please Select Party Level ...`);
	for (let level = 1; level <= 20; level++) {
		selectBuilder.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`Party Level ${level}`)
				.setValue(String(level))
				.setDefault(selected ? level === selected : level === 1)
		);
	}
	return selectBuilder;
}

function createPartySizeSelect<ControlArg extends Control>(args: CustomIdArgs<ControlArg>, selected?: number): StringSelectMenuBuilder {
	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId(args, "partySize"))
		.setPlaceholder(`Please Party Size ...`);
	for (let characters = 1; characters <= 10; characters++) {
		selectBuilder.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`${characters} Characters`)
				.setValue(String(characters))
				.setDefault(selected ? characters === selected : characters === 4)
		);
	}
	return selectBuilder;
}

function getCreatureData(partyLevel: number, creatureLevel: number) {
	const delta = creatureLevel - partyLevel;
	const sign = delta < 0 ? "-" : "+";
	switch(delta) {
		case -4: return { delta, sign, xp:10, role:"Low-threat lackey" };
		case -3: return { delta, sign, xp:15, role:"Low- or moderate-threat lackey" };
		case -2: return { delta, sign, xp:20, role:"Any lackey or standard creature" };
		case -1: return { delta, sign, xp:30, role:"Any standard creature" };
		case 0: return { delta, sign, xp:40, role:"Any standard creature or low-threat boss" };
		case 1: return { delta, sign, xp:60, role:"Low- or moderate-threat boss" };
		case 2: return { delta, sign, xp:80, role:"Moderate- or severe-threat boss" };
		case 3: return { delta, sign, xp:120, role:"Severe- or extreme-threat boss" };
		case 4: return { delta, sign, xp:160, role:"Extreme-threat solo boss" };
		default:
			if (delta < -4) return { delta, sign, xp:0, role:"No Threat" };
			return { delta, sign, xp:0, role:"TPK" };
	}
}

function createAddCreatureSelect<ControlArg extends Control>(args: CustomIdArgs<ControlArg>, partyLevel: number): StringSelectMenuBuilder {
	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId(args, "addCreature"))
		.setPlaceholder(`Add a Creature ...`);
	for (let creatureLevel = partyLevel - 5; creatureLevel <= partyLevel + 5; creatureLevel++) {
		const { delta, sign, xp, role } = getCreatureData(partyLevel, creatureLevel);
		const absDelta = Math.abs(delta);
		selectBuilder.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`Creature Level ${creatureLevel} (${xp} XP)`)
				.setDescription(`Party Level ${sign} ${absDelta} - ${role}`)
				.setValue(String(creatureLevel))
		);
	}
	return selectBuilder;
}

type Args = {
	customId: string;
	customIdArgs: CustomIdArgs<any>;
	gameSystemType: GameSystemType;
	partyLevel: number;
	partySize: number;
	userId: Snowflake;
};
function getArgs(sageCommand: SageCommand, messageIds?: Snowflake[]): Args {
	const customId = sageCommand.isSageInteraction("MESSAGE") ? sageCommand.interaction.customId : `||${sageCommand.authorDid}||NoControl`;
	const customIdArgs = parseCustomId(customId);
	if (messageIds) customIdArgs.messageIds = messageIds;

	const gameSystemType = getSelectedOrDefaultEnum<GameSystemType>(sageCommand, GameSystemType, createCustomId(customIdArgs, "gameSystem"), "game") ?? sageCommand.gameSystemType ?? GameSystemType.PF2e;
	const partyLevel = getSelectedOrDefaultNumber(sageCommand, createCustomId(customIdArgs, "partyLevel")) ?? 1;
	const partySize = getSelectedOrDefaultNumber(sageCommand, createCustomId(customIdArgs, "partySize")) ?? 4;
	return {
		customId,
		customIdArgs,
		gameSystemType,
		partyLevel,
		partySize,
		userId: customIdArgs.userId,
	};
};

async function getMessages(sageCommand: SageCommand, args: Args): Promise<Message[] | undefined> {

	const channel = await sageCommand.sageCache.fetchChannel(sageCommand.channelDid);
	if (!channel?.isTextBased()) return undefined;

	const messages: Message[] = [];

	for (const messageId of args.customIdArgs.messageIds) {
		const message = await channel.messages.fetch(messageId);
		if (!message) return undefined;
		messages.push(message);
	}

	return messages;
}

function buildFormOne(args: Args): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
	const gameSystemSelect = createGameSystemSelect(args.customIdArgs, args.gameSystemType);
	const partyLevelSelect = createPartyLevelSelect(args.customIdArgs, args.partyLevel);
	const partySizeSelect = createPartySizeSelect(args.customIdArgs, args.partySize);
	return [
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(gameSystemSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(partyLevelSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(partySizeSelect),
	];
}
function buildFormTwo(args: Args): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
	const creatureSelect = createAddCreatureSelect(args.customIdArgs, args.partyLevel);
	const deleteButton = createMessageDeleteButton(args.userId, { customId:createCustomId(args.customIdArgs, "deleteForm"), label:"Delete" });
	return [
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(creatureSelect),
		// add simple hazard
		// add complex hazard
		// remove item
		new ActionRowBuilder<ButtonBuilder>().setComponents(deleteButton),
	];
}

type Budget = { Trivial:number; Low:number; Moderate:number; Severe:number; Extreme:number; }
function createBudget({ partySize }: Args): Budget {
	const budget = {
		Trivial: 40,
		Low: 60,
		Moderate: 80,
		Severe: 120,
		Extreme: 160,
	};
	const keys = Object.keys(budget) as (keyof typeof budget)[];

	if (partySize > 0 && partySize !== 4) {
		const adjustments = {
			Trivial: 10,
			Low: 20,
			Moderate: 20,
			Severe: 30,
			Extreme: 40,
		};
		const multiplier = partySize - 4;
		for (const key of keys) {
			budget[key] += adjustments[key] * multiplier;
		}
	}

	return budget;
}

function budgetToString(budget: Budget): string[] {
	const lines = [
		`<h3>Encounter Budget</h3>`,
		...Object.entries(budget).map(([key, value]) => `> <b>${key}</b> ${value} XP`),
	];
	return lines;
}

function createContent(args: Args): RenderableContent {
	const renderable = createCommandRenderableContent();
	renderable.append(`<h3>Encounter Builder</h3>`);
	renderable.appendBlock(
		`<b>Game System</b> ${parseGameSystem(args.gameSystemType)?.name ?? "Pathfinder 2e"}`,
		`<b>Party Level</b> ${args.partyLevel}`,
		`<b>Party Size</b> ${args.partySize}`,
	);

	const budget = createBudget(args);

	budgetToString(budget).forEach(line => renderable.append(line));

	let totalXp = 0;
	let tpk = false;
	const encounterLines: string[] = [];
	const creatures = args.customIdArgs.creatures.slice().sort();
	if (creatures.length) {
		creatures.forEach(creatureLevel => {
			const { delta, sign, xp, role } = getCreatureData(args.partyLevel, creatureLevel);
			const absDelta = Math.abs(delta);
			encounterLines.push(`Creature Level ${creatureLevel} (${xp} XP)\n- Party Level ${sign} ${absDelta} (${role})`);
			totalXp += xp;
			if (role === "TPK") tpk = true;
		});
	}

	let threat = "Trivial";
	if (tpk) {
		threat = "TPK";
	}else {
		Object.entries(budget).forEach(([key, value]) => {
			if (totalXp >= value) threat = key;
		});
	}

	renderable.append(`<h3>Encounter - ${totalXp} XP (${threat})</h3>`);
	encounterLines.forEach(line => renderable.appendBlock(line));

	return renderable;
}

async function showEncounterBuilder(sageCommand: SageCommand): Promise<void> {
	const localize = sageCommand.getLocalizer();

	const messageOne = await sageCommand.replyStack.reply({ content:"Loading ..." }, true).catch(warn);
	if (!messageOne) return sageCommand.replyStack.whisper({ content:localize("SORRY_WE_DONT_KNOW") });

	const messageTwo = await sageCommand.replyStack.send({ content:"Loading ..." }, true).catch(warn);
	if (!messageTwo) {
		await deleteMessage(messageOne);
		return sageCommand.replyStack.whisper({ content:localize("SORRY_WE_DONT_KNOW") });
	}

	const args = getArgs(sageCommand, [messageOne.id as Snowflake, messageTwo.id as Snowflake]);
	const content = createContent(args);
	const components = buildFormOne(args);
	const options = sageCommand.resolveToOptions({ content, components });

	await messageOne.edit(options).catch(warn);
	await messageTwo.edit({ content:ZERO_WIDTH_SPACE, components:buildFormTwo(args) }).catch(warn);
}

async function changeEncounterBuilder(sageInteraction: SageInteraction<StringSelectMenuInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();

	const localize = sageInteraction.getLocalizer();

	const args = getArgs(sageInteraction);

	// add creature
	const creatureLevel = getSelectedOrDefaultNumber(sageInteraction, createCustomId(args.customIdArgs, "addCreature"));
	if (creatureLevel !== undefined) {
		args.customIdArgs.creatures.push(creatureLevel);
	}

	const messages = await getMessages(sageInteraction, args);
	if (!messages) {
		debug("no messages");
		return sageInteraction.replyStack.whisper({ content:localize("SORRY_WE_DONT_KNOW") });
	}
	const [messageOne, messageTwo] = messages;

	const content = createContent(args);
	const components = buildFormOne(args);
	const options = sageInteraction.resolveToOptions({ content, components });

	await messageOne.edit(options).catch(warn);
	await messageTwo.edit({ content:ZERO_WIDTH_SPACE, components:buildFormTwo(args) }).catch(warn);
	debug("done");
}

async function deleteEncounterBuilder(sageCommand: SageCommand): Promise<void> {
	const localize = sageCommand.getLocalizer();

	const args = getArgs(sageCommand);

	const messages = await getMessages(sageCommand, args);
	if (!messages) {
		return sageCommand.replyStack.whisper({ content:localize("SORRY_WE_DONT_KNOW") });
	}

	for (const message of messages) {
		await deleteMessage(message);
	}
}

export function registerEncounterBuilder(): void {
	registerListeners({ commands:["encounter|builder"], handler:showEncounterBuilder });
	registerListeners({ commands:[/p20\|encounterBuilder\|\d{16,}\|\d{16,}\-\d{16,}\|(gameSystem|partyLevel|partySize|addCreature)/], interaction:changeEncounterBuilder });
	registerListeners({ commands:[/p20\|encounterBuilder\|\d{16,}\|\d{16,}\-\d{16,}\|deleteForm/], interaction:deleteEncounterBuilder });

}