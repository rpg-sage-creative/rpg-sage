import { GameSystemType, parseGameSystem } from "@rsc-sage/types";
import type { SortResult } from "@rsc-utils/array-utils";
import { warn, type Snowflake } from "@rsc-utils/core-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Message, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js";
import { deleteMessage } from "../../sage-lib/discord/deletedMessages";
import { registerListeners } from "../../sage-lib/discord/handlers/registerListeners";
import { createCommandRenderableContent } from "../../sage-lib/sage/commands/cmd";
import type { SageCommand } from "../../sage-lib/sage/model/SageCommand";
import type { SageInteraction } from "../../sage-lib/sage/model/SageInteraction";
import { createMessageDeleteButton } from "../../sage-lib/sage/model/utils/deleteButton";
import { findComponent } from "./lib/findComponent";
import { getSelectedOrDefault, getSelectedOrDefaultEnum, getSelectedOrDefaultNumber } from "./lib/getSelectedOrDefault";
import { getPaizoGameSystems } from "./lib/PaizoGameSystem";

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

type Control = "gameSystem" | "partyLevel" | "partySize" | "creature" | "simpleHazard" | "complexHazard" | "removeItem" | "resetForm" | "deleteForm";

type CustomIdArgs<ControlArg extends Control> = CustomIdArgsBase<"p20", "encounterBuilder", ControlArg>;

function createCustomId<ControlArg extends Control>(args: CustomIdArgs<ControlArg>, control?: Control): string {
	return [
		"p20",
		"encounterBuilder",
		args.userId,
		args.messageIds.join("-"),
		control ?? args.control
	].join("|");
}
function parseCustomId<ControlArg extends Control>(customId: string): CustomIdArgs<ControlArg> {
	const [ gameSystem, form, userId, messageIds, control ] = customId.split("|");
	return {
		gameSystem: gameSystem as "p20",
		form: form as "encounterBuilder",
		userId: userId as Snowflake,
		messageIds: messageIds.split("-") as Snowflake[],
		control: control as ControlArg,
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

function getXpData({ type, level, partyLevel }: { type: "creature" | "complexHazard" | "simpleHazard", level: number, partyLevel: number }) {
	const delta = level - partyLevel;
	const sign = delta < 0 ? "-" : "+";
	const ret = (xp: number, role: string) => {
		if (type === "simpleHazard") xp /= 5;
		return { type, level, partyLevel, delta, sign, xp, role };
	};
	switch(delta) {
		case -4: return ret(10, "Low-threat lackey");
		case -3: return ret(15, "Low- or moderate-threat lackey");
		case -2: return ret(20, "Any lackey or standard creature");
		case -1: return ret(30, "Any standard creature");
		case 0: return ret(40, "Any standard creature or low-threat boss");
		case 1: return ret(60, "Low- or moderate-threat boss");
		case 2: return ret(80, "Moderate- or severe-threat boss");
		case 3: return ret(120, "Severe- or extreme-threat boss");
		case 4: return ret(160, "Extreme-threat solo boss");
		default:
			if (delta < -4) return ret(0, "No Threat");
			return ret(0, "TPK");
	}
}

function createAddCreatureOrHazardSelect<ControlArg extends Control>(args: CustomIdArgs<ControlArg>, partyLevel: number, type: "creature" | "complexHazard" | "simpleHazard"): StringSelectMenuBuilder {
	let label = "Creature";
	if (type === "simpleHazard") label = "Simple Hazard";
	else if (type === "complexHazard") label = "Complex Hazard";

	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId(args, type))
		.setPlaceholder(`Add a ${label} ...`);
	for (let level = partyLevel - 5; level <= partyLevel + 5; level++) {
		const data = getXpData({ type, level, partyLevel });
		const absDelta = Math.abs(data.delta);
		const role = type === "creature" ? `- ${data.role}` : ``;
		selectBuilder.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`${label} Level ${level} (${data.xp} XP)`)
				.setDescription(`Party Level ${data.sign} ${absDelta} ${role}`)
				.setValue(String(level))
		);
	}
	return selectBuilder;
}

type EncounterItemType = "creature" | "simpleHazard" | "complexHazard";
type EncounterItem = {
	code: "cr" | "sh" | "ch";
	label: "Creature" | "Simple Hazard" | "Complex Hazard";
	level: number;
	type: EncounterItemType;
};
function createEncounterItem(type: EncounterItemType, level: number): EncounterItem {
	const item = { type, level } as EncounterItem;
	switch(type) {
		case "complexHazard": item.code = "ch"; item.label = "Complex Hazard"; break;
		case "simpleHazard": item.code = "sh"; item.label = "Simple Hazard"; break;
		case "creature": item.code = "cr"; item.label = "Creature"; break;
	}
	return item;
}
function encounterItemSorter(a: EncounterItem, b: EncounterItem): SortResult {
	if (a.level !== b.level) return a.level < b.level ? -1 : 1;
	if (a.code === b.code) return 0;
	if (a.code === "cr") return -1; // cr + sh && cr + ch
	if (b.code === "cr") return +1; // sh + cr && ch + cr
	if (a.code === "ch") return +1; // ch + cr && ch + sh
	if (b.code === "ch") return -1; // cr + ch && sh + ch
	// if (a.code === "sh") return -1; // sh + cr && sh + ch
	// if (b.code === "sh") return +1; // cr + sh && ch + sh
	return 0;
}
function createRemoveSelect<ControlArg extends Control>(args: CustomIdArgs<ControlArg>, encounter: Encounter, partyLevel: number): StringSelectMenuBuilder {
	const items: EncounterItem[] = [];
	encounter.creatures.forEach(level => items.push(createEncounterItem("creature", level)));
	encounter.simpleHazards.forEach(level => items.push(createEncounterItem("simpleHazard", level)));
	encounter.complexHazards.forEach(level => items.push(createEncounterItem("complexHazard", level)));
	items.sort(encounterItemSorter);

	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId(args, "removeItem"))
		.setPlaceholder(`Remove a Creature or Hazard ...`);
	items.forEach(({ code, label, level, type }) => {
		const data = getXpData({ type, level, partyLevel });
		const absDelta = Math.abs(data.delta);
		const role = type === "creature" ? `- ${data.role}` : ``;
		selectBuilder.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`${label} Level ${level} (${data.xp} XP)`)
				.setDescription(`Party Level ${data.sign} ${absDelta} ${role}`)
				.setValue(`${code}${level}`)
		);
	});
	if (!items.length) {
		selectBuilder.setDisabled(true);
		selectBuilder.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`Nothing to remove.`)
				.setValue(`0`)
		);
	}
	return selectBuilder;
}
type Encounter = {
	creatures: number[];
	simpleHazards: number[];
	complexHazards: number[];
};
function parseEncounter(select?: StringSelectMenuComponent): Encounter {
	const encounter = {
		creatures: [] as number[],
		simpleHazards: [] as number[],
		complexHazards: [] as number[],
	};
	select?.options.forEach(option => {
		const type = option.value.slice(0, 2);
		const level = +option.value.slice(2);
		switch(type) {
			case "sh": encounter.simpleHazards.push(level); break;
			case "ch": encounter.complexHazards.push(level); break;
			case "cr": default: encounter.creatures.push(level); break;
		}
	});
	return encounter;
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
	/*
QUICK ADVENTURE GROUPS
If you want an easy framework for building an encounter,
you can use one of the following basic structures and slot
in monsters and NPCs.
• Boss and Lackeys (120 XP): One creature of party level
+ 2, four creatures of party level – 4
• Boss and Lieutenant (120 XP): One creature of party
level + 2, one creature of party level
• Elite Enemies (120 XP): Three creatures of party level
• Lieutenant and Lackeys (80 XP): One creature of party
level, four creatures of party level – 4
• Mated Pair (80 XP): Two creatures of party level
• Troop (80 XP): One creature of party level, two
creatures of party level – 2
• Mook Squad (60 XP): Six creatures of party level – 4
	*/
	return [
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(gameSystemSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(partyLevelSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(partySizeSelect),
	];
}
function buildFormTwo(args: Args, encounter: Encounter): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
	const creatureSelect = createAddCreatureOrHazardSelect(args.customIdArgs, args.partyLevel, "creature");
	const simpleHazardSelect = createAddCreatureOrHazardSelect(args.customIdArgs, args.partyLevel, "simpleHazard");
	const complexHazardSelect = createAddCreatureOrHazardSelect(args.customIdArgs, args.partyLevel, "complexHazard");
	const removeSelect = createRemoveSelect(args.customIdArgs, encounter, args.partyLevel);
	const resetButton = new ButtonBuilder().setCustomId(createCustomId(args.customIdArgs, "resetForm")).setLabel("Reset").setStyle(ButtonStyle.Primary);
	const deleteButton = createMessageDeleteButton(args.userId, { customId:createCustomId(args.customIdArgs, "deleteForm"), label:"Delete" });
	return [
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(creatureSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(simpleHazardSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(complexHazardSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(removeSelect),
		new ActionRowBuilder<ButtonBuilder>().setComponents(resetButton, deleteButton),
	];
}

/*
verbose threat descriptions

Trivial-threat encounters are so easy that the characters
have essentially no chance of losing. They’re unlikely to
spend significant resources unless they’re particularly
wasteful. These encounters work best as warm-ups, palate
cleansers, or reminders of how awesome the characters are.
A trivial-threat encounter can still be fun to play, so don’t
ignore them just because of the lack of challenge.

Low-threat encounters present a veneer of difficulty
and typically use some of the party’s resources. However,
it would be rare or the result of very poor tactics for the
entire party to be seriously endangered.

Moderate-threat encounters are a serious challenge
to the characters, though unlikely to overpower them
completely. Characters usually need to use sound tactics
and manage their resources wisely to come out of a
moderate-threat encounter ready to continue on and face
a harder challenge without resting.

Severe-threat encounters are the hardest encounters
most groups of characters have a good chance to defeat.
These encounters are appropriate for important moments
in your story, such as confronting a final boss. Use severe
encounters carefully—there’s a good chance a character
could die, and a small chance the whole group could. Bad
luck, poor tactics, or a lack of resources can easily turn a
severe-threat encounter against the characters, and a wise
group keeps the option to disengage open.

Extreme-threat encounters are so dangerous that
they are likely to be an even match for the characters,
particularly if the characters are low on resources. This
makes them too challenging for most uses! Use an extreme
encounter only if you’re willing to take the chance the
entire party will die. An extreme-threat encounter might
be appropriate for a fully rested group of characters that
can go all-out, for the climactic encounter at the end of an
entire campaign, or for a group of veteran players using
advanced tactics and teamwork.
*/
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

function createContent(args: Args, encounter: Encounter): RenderableContent {
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
	let empty = true;

	const creatureLines: string[] = [];
	const creatures = encounter.creatures.slice().sort();
	if (creatures.length) {
		creatures.forEach(level => {
			const { delta, sign, xp, role } = getXpData({ type:"creature", level, partyLevel:args.partyLevel });
			const absDelta = Math.abs(delta);
			creatureLines.push(`Creature Level ${level} (${xp} XP)\n- Party Level ${sign} ${absDelta} (${role})`);
			totalXp += xp;
			if (role === "TPK") tpk = true;
			empty = false;
		});
	}

	const simpleHazardLines: string[] = [];
	const simpleHazards = encounter.simpleHazards.slice().sort();
	if (simpleHazards.length) {
		simpleHazards.forEach(level => {
			const { delta, sign, xp, role } = getXpData({ type:"simpleHazard", level, partyLevel:args.partyLevel });
			const absDelta = Math.abs(delta);
			simpleHazardLines.push(`Simple Hazard Level ${level} (${xp} XP)\n- Party Level ${sign} ${absDelta} (${role})`);
			totalXp += xp;
			empty = false;
		});
	}

	const complexHazardLines: string[] = [];
	const complexHazards = encounter.complexHazards.slice().sort();
	if (complexHazards.length) {
		complexHazards.forEach(level => {
			const { delta, sign, xp, role } = getXpData({ type:"complexHazard", level, partyLevel:args.partyLevel });
			const absDelta = Math.abs(delta);
			complexHazardLines.push(`Complex Hazard Level ${level} (${xp} XP)\n- Party Level ${sign} ${absDelta} (${role})`);
			totalXp += xp;
			empty = false;
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
	if (creatureLines.length) {
		renderable.append(`<b>Creatures</b>`);
		creatureLines.forEach(line => renderable.appendBlock(line));
	}
	if (simpleHazardLines.length) {
		renderable.append(`<b>Simple Hazards</b>`);
		simpleHazardLines.forEach(line => renderable.appendBlock(line));
	}
	if (complexHazardLines.length) {
		renderable.append(`<b>Complex Hazards</b>`);
		complexHazardLines.forEach(line => renderable.appendBlock(line));
	}
	if (empty) {
		renderable.append("<i>Empty Encounter</i>");
	}

	return renderable;
}

async function showEncounter(sageCommand: SageCommand): Promise<void> {
	const localize = sageCommand.getLocalizer();

	const messageOne = await sageCommand.replyStack.reply({ content:"Loading ..." }, true).catch(warn);
	if (!messageOne) return sageCommand.replyStack.whisper({ content:localize("SORRY_WE_DONT_KNOW") });

	const messageTwo = await sageCommand.replyStack.send({ content:"Loading ..." }, true).catch(warn);
	if (!messageTwo) {
		await deleteMessage(messageOne);
		return sageCommand.replyStack.whisper({ content:localize("SORRY_WE_DONT_KNOW") });
	}

	const args = getArgs(sageCommand, [messageOne.id as Snowflake, messageTwo.id as Snowflake]);
	const encounter = parseEncounter();

	await updateEncounter(sageCommand, { args, encounter, messages:[messageOne, messageTwo] });
}

async function changeEncounter(sageInteraction: SageInteraction<StringSelectMenuInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();

	const args = getArgs(sageInteraction);

	const messages = await getMessages(sageInteraction, args);
	if (!messages) {
		const localize = sageInteraction.getLocalizer();
		return sageInteraction.replyStack.whisper({ content:localize("SORRY_WE_DONT_KNOW") });
	}

	const encounter = parseEncounter(await findComponent<StringSelectMenuComponent>(sageInteraction, createCustomId(args.customIdArgs, "removeItem")))

	// add creature
	const creatureLevel = getSelectedOrDefaultNumber(sageInteraction, createCustomId(args.customIdArgs, "creature"));
	if (creatureLevel !== undefined) {
		encounter.creatures.push(creatureLevel);
	}
	// add simple hazard
	const simpleHazardLevel = getSelectedOrDefaultNumber(sageInteraction, createCustomId(args.customIdArgs, "simpleHazard"));
	if (simpleHazardLevel !== undefined) {
		encounter.simpleHazards.push(simpleHazardLevel);
	}
	// add complex hazard
	const complexHazardLevel = getSelectedOrDefaultNumber(sageInteraction, createCustomId(args.customIdArgs, "complexHazard"));
	if (complexHazardLevel !== undefined) {
		encounter.complexHazards.push(complexHazardLevel);
	}
	// remove item
	const itemCode = getSelectedOrDefault(sageInteraction, createCustomId(args.customIdArgs, "removeItem"));
	if (itemCode) {
		const type = itemCode.slice(0, 2);
		const level = +itemCode.slice(2);
		if (type === "cr" && encounter.creatures.includes(level)) {
			encounter.creatures.splice(encounter.creatures.indexOf(level), 1);
		}else if (type === "sh" && encounter.simpleHazards.includes(level)) {
			encounter.simpleHazards.splice(encounter.simpleHazards.indexOf(level), 1);
		}else if (type === "ch" && encounter.complexHazards.includes(level)) {
			encounter.complexHazards.splice(encounter.complexHazards.indexOf(level), 1);
		}
	}

	await updateEncounter(sageInteraction, { args, encounter, messages });
}

async function resetEncounter(sageInteraction: SageInteraction<ButtonInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();

	const args = getArgs(sageInteraction);

	const messages = await getMessages(sageInteraction, args);
	if (!messages) {
		const localize = sageInteraction.getLocalizer();
		return sageInteraction.replyStack.whisper({ content:localize("SORRY_WE_DONT_KNOW") });
	}

	const encounter = parseEncounter();

	await updateEncounter(sageInteraction, { args, encounter, messages });
}

type UpdateEncounterArgs = {
	args: Args;
	encounter: Encounter;
	messages: Message[];
};
async function updateEncounter(sageCommand: SageCommand, { args, encounter, messages }: UpdateEncounterArgs): Promise<void> {

	const content = createContent(args, encounter);
	const components = buildFormOne(args);
	const options = sageCommand.resolveToOptions({ content, components });

	const [messageOne, messageTwo] = messages;
	await messageOne.edit(options).catch(warn);
	await messageTwo.edit({ content:ZERO_WIDTH_SPACE, components:buildFormTwo(args, encounter) }).catch(warn);
}

async function deleteEncounter(sageCommand: SageCommand): Promise<void> {
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
	registerListeners({ commands:["encounter|builder"], handler:showEncounter });
	registerListeners({ commands:[/p20\|encounterBuilder\|\d{16,}\|\d{16,}\-\d{16,}\|(gameSystem|partyLevel|partySize|creature|simpleHazard|complexHazard|removeItem)/], interaction:changeEncounter });
	registerListeners({ commands:[/p20\|encounterBuilder\|\d{16,}\|\d{16,}\-\d{16,}\|resetForm/], interaction:resetEncounter });
	registerListeners({ commands:[/p20\|encounterBuilder\|\d{16,}\|\d{16,}\-\d{16,}\|deleteForm/], interaction:deleteEncounter });
}