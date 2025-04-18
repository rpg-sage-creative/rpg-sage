import { GameSystemType, parseGameSystem } from "@rsc-sage/types";
import { warn, type Snowflake, type SortResult } from "@rsc-utils/core-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, Message, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js";
import { deleteMessage } from "../../sage-lib/discord/deletedMessages.js";
import { registerListeners } from "../../sage-lib/discord/handlers/registerListeners.js";
import { createCommandRenderableContent } from "../../sage-lib/sage/commands/cmd.js";
import type { SageCommand } from "../../sage-lib/sage/model/SageCommand.js";
import type { SageInteraction } from "../../sage-lib/sage/model/SageInteraction.js";
import { createMessageDeleteButton } from "../../sage-lib/sage/model/utils/deleteButton.js";
import { getPaizoGameSystems } from "./lib/PaizoGameSystem.js";
import { fetchSelectedOrDefault, fetchSelectedOrDefaultEnum, fetchSelectedOrDefaultNumber, findComponent } from "./lib/fetchSelectedOrDefault.js";

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

type Control = "gameSystem" | "partyLevel" | "partySize" | "creature" | "simpleHazard" | "complexHazard" | "removeItem" | "resetForm" | "deleteForm" | "verboseToggle";

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
	code: EncounterItemCode;
	count: number;
	label: "Creature" | "Simple Hazard" | "Complex Hazard";
	level: number;
	type: EncounterItemType;
};
type EncounterItemCode = "cr"|"sh"|"ch";
function addToMap(itemMap: Map<string, EncounterItem>, code: EncounterItemCode, level: number): void {
	const key = `${code}${level}`;
	if (itemMap.has(key)) {
		itemMap.get(key)!.count++;
	}else {
		itemMap.set(key, createEncounterItem(code, level));
	}
}
function createEncounterItem(code: EncounterItemCode, level: number, count = 1): EncounterItem {
	switch(code) {
		case "ch": return { code, count, label:"Complex Hazard", level, type:"complexHazard" };
		case "sh": return { code, count, label:"Simple Hazard", level, type:"simpleHazard" };
		case "cr": return { code, count, label:"Creature", level, type:"creature" };
	}
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
	const itemMap = new Map<string, EncounterItem>();
	encounter.creatures.forEach(level => addToMap(itemMap, "cr", level));
	encounter.simpleHazards.forEach(level => addToMap(itemMap, "sh", level));
	encounter.complexHazards.forEach(level => addToMap(itemMap, "ch", level));

	const items = [...itemMap.values()];
	items.sort(encounterItemSorter);

	const selectBuilder = new StringSelectMenuBuilder()
		.setCustomId(createCustomId(args, "removeItem"))
		.setPlaceholder(`Remove a Creature or Hazard ...`);
	items.forEach(({ code, count, label, level, type }) => {
		const data = getXpData({ type, level, partyLevel });
		const value = `${code}${level}x${count}`;
		const absDelta = Math.abs(data.delta);
		const role = type === "creature" ? `- ${data.role}` : ``;
		selectBuilder.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel(`${label} Level ${level} (${data.xp} XP)`)
				.setDescription(`Party Level ${data.sign} ${absDelta} ${role}`)
				.setValue(value)
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
function parseEncounterItem(value: string): EncounterItem {
	const regex = /(?<code>sh|ch|cr)(?<level>-?\d+)x(?<count>\d+)/;
	const { code = "cr", level = 0, count = 0 } = regex.exec(value)?.groups ?? {};
	return createEncounterItem(code as "cr", +level, +count);
}
async function parseEncounter(sageCommand?: SageCommand, messages?: Message[], customIdArgs?: CustomIdArgs<any>): Promise<Encounter> {
	const encounter = {
		creatures: [] as number[],
		simpleHazards: [] as number[],
		complexHazards: [] as number[],
	};
	if (sageCommand && messages?.length && customIdArgs) {
		const select = await findComponent<StringSelectMenuComponent>([sageCommand, ...messages], createCustomId(customIdArgs, "removeItem"));
		if (!select?.disabled) {
			select?.options.forEach(option => {
				let { code, count, level } = parseEncounterItem(option.value);
				const array = encounter[code === "sh" ? "simpleHazards" : code === "ch" ? "complexHazards" : "creatures"];
				if (array && count > 0) {
					while (count--) array.push(level);
				}
			});
		}
	}
	return encounter;
}
async function getVerbose(sageCommand: SageCommand, messages: Message[], customIdArgs: CustomIdArgs<any>): Promise<boolean | undefined> {
	const button = await findComponent<ButtonComponent>([sageCommand, ...messages], createCustomId(customIdArgs, "verboseToggle"));
	if (button) {
		return sageCommand.isSageInteraction("BUTTON")
			? button.label === "Verbose"
			: button.label !== "Verbose";
	}
	return sageCommand.args.getBoolean("verbose") ?? undefined;
}
type Args = {
	customId: string;
	customIdArgs: CustomIdArgs<any>;
	encounter: Encounter;
	gameSystemType: GameSystemType;
	messages: Message[];
	partyLevel: number;
	partySize: number;
	userId: Snowflake;
	verbose: boolean;
};
async function getArgs(sageCommand: SageCommand, messages?: Message[]): Promise<Args | undefined> {
	const customId = sageCommand.isSageInteraction("MESSAGE") ? sageCommand.interaction.customId : `||${sageCommand.authorDid}||NoControl`;
	const customIdArgs = parseCustomId(customId);

	// fetch the messages
	if (messages) {
		customIdArgs.messageIds = messages.map(({ id }) => id) as Snowflake[];
	}else {
		messages = await getMessages(sageCommand, customIdArgs.messageIds);
		if (!messages) {
			return undefined;
		}
	}

	const fetchInputs = [sageCommand, ...messages];
	const gameSystemType = await fetchSelectedOrDefaultEnum<GameSystemType>(fetchInputs, GameSystemType, createCustomId(customIdArgs, "gameSystem"), "game") ?? sageCommand.gameSystemType ?? GameSystemType.PF2e;
	const partyLevel = await fetchSelectedOrDefaultNumber(fetchInputs, createCustomId(customIdArgs, "partyLevel")) ?? 1;
	const partySize = await fetchSelectedOrDefaultNumber(fetchInputs, createCustomId(customIdArgs, "partySize")) ?? 4;
	const verbose = await getVerbose(sageCommand, messages, customIdArgs);

	const encounter = customIdArgs.control !== "resetForm"
		? await parseEncounter(sageCommand, messages, customIdArgs)
		: await parseEncounter();
	return {
		customId,
		customIdArgs,
		encounter,
		gameSystemType,
		messages,
		partyLevel,
		partySize,
		userId: customIdArgs.userId,
		verbose: verbose === true,
	};
};

async function getMessages(sageCommand: SageCommand, messageIds: Snowflake[]): Promise<Message[] | undefined> {

	const channel = await sageCommand.sageCache.fetchChannel(sageCommand.channelDid);
	if (!channel?.isTextBased()) return undefined;

	const messages: Message[] = [];

	for (const messageId of messageIds) {
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
function buildFormTwo(args: Args): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
	const creatureSelect = createAddCreatureOrHazardSelect(args.customIdArgs, args.partyLevel, "creature");
	const simpleHazardSelect = createAddCreatureOrHazardSelect(args.customIdArgs, args.partyLevel, "simpleHazard");
	const complexHazardSelect = createAddCreatureOrHazardSelect(args.customIdArgs, args.partyLevel, "complexHazard");
	const removeSelect = createRemoveSelect(args.customIdArgs, args.encounter, args.partyLevel);
	const resetButton = new ButtonBuilder().setCustomId(createCustomId(args.customIdArgs, "resetForm")).setLabel("Reset").setStyle(ButtonStyle.Primary);
	const verboseButton = new ButtonBuilder().setCustomId(createCustomId(args.customIdArgs, "verboseToggle")).setLabel(args.verbose ? `Compact` : `Verbose`).setStyle(ButtonStyle.Secondary);
	const deleteButton = createMessageDeleteButton(args.userId, { customId:createCustomId(args.customIdArgs, "deleteForm"), label:"Delete" });
	return [
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(creatureSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(simpleHazardSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(complexHazardSelect),
		new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(removeSelect),
		new ActionRowBuilder<ButtonBuilder>().setComponents(resetButton, verboseButton, deleteButton),
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

function createContent(args: Args): RenderableContent {
	const { encounter, partyLevel } = args;
	const renderable = createCommandRenderableContent();
	renderable.append(`<h3>Encounter Builder</h3>`);
	renderable.appendBlock(
		`<b>Game System</b> ${parseGameSystem(args.gameSystemType)?.name ?? "Pathfinder 2e"}`,
		`<b>Party Level</b> ${partyLevel}`,
		`<b>Party Size</b> ${args.partySize}`,
	);

	const budget = createBudget(args);

	if (args.verbose) {
		budgetToString(budget).forEach(line => renderable.append(line));
	}

	let totalXp = 0;
	let tpk = false;
	let empty = true;

	const creatureLines: string[] = [];
	const creatures = encounter.creatures.slice().sort();
	if (creatures.length) {
		creatures.forEach(level => {
			const { delta, sign, xp, role } = getXpData({ type:"creature", level, partyLevel:partyLevel });
			const absDelta = Math.abs(delta);
			if (args.verbose) {
				creatureLines.push(`Creature Level ${level} (${xp} XP)\n- Party Level ${sign} ${absDelta} (${role})`);
			}else {
				creatureLines.push(`Creature Level ${level} (${xp} XP)`);
			}
			totalXp += xp;
			if (role === "TPK") tpk = true;
			empty = false;
		});
	}

	const simpleHazardLines: string[] = [];
	const simpleHazards = encounter.simpleHazards.slice().sort();
	if (simpleHazards.length) {
		simpleHazards.forEach(level => {
			const { delta, sign, xp } = getXpData({ type:"simpleHazard", level, partyLevel:partyLevel });
			const absDelta = Math.abs(delta);
			if (args.verbose) {
				creatureLines.push(`Simple Hazard Level ${level} (${xp} XP)\n- Party Level ${sign} ${absDelta}`);
			}else {
				creatureLines.push(`Simple Hazard Level ${level} (${xp} XP)`);
			}
			totalXp += xp;
			empty = false;
		});
	}

	const complexHazardLines: string[] = [];
	const complexHazards = encounter.complexHazards.slice().sort();
	if (complexHazards.length) {
		complexHazards.forEach(level => {
			const { delta, sign, xp } = getXpData({ type:"complexHazard", level, partyLevel:partyLevel });
			const absDelta = Math.abs(delta);
			if (args.verbose) {
				creatureLines.push(`Complex Hazard Level ${level} (${xp} XP)\n- Party Level ${sign} ${absDelta}`);
			}else {
				creatureLines.push(`Complex Hazard Level ${level} (${xp} XP)`);
			}
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
	const sorry = async (...messages: Message[]) => {
		for (const message of messages) await deleteMessage(message);
		sageCommand.replyStack.whisper({ content:sageCommand.getLocalizer()("SORRY_WE_DONT_KNOW") });
	};

	const messageOne = await sageCommand.replyStack.reply({ content:"Loading ..." }, true).catch(warn);
	if (!messageOne) {
		return sorry();
	}

	const messageTwo = await sageCommand.replyStack.send({ content:"Loading ..." }, true).catch(warn);
	if (!messageTwo) {
		return sorry(messageOne);
	}

	const args = await getArgs(sageCommand, [messageOne, messageTwo]);
	if (!args) {
		return sorry(messageOne, messageTwo);
	}

	await updateEncounter(sageCommand, args);
}

async function changeEncounter(sageInteraction: SageInteraction<StringSelectMenuInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();

	const args = await getArgs(sageInteraction);
	if (!args) {
		const localize = sageInteraction.getLocalizer();
		return sageInteraction.replyStack.whisper({ content:localize("SORRY_WE_DONT_KNOW") });
	}

	const { encounter } = args;

	// add creature
	const creatureLevel = await fetchSelectedOrDefaultNumber(sageInteraction, createCustomId(args.customIdArgs, "creature"));
	if (creatureLevel !== undefined) {
		encounter.creatures.push(creatureLevel);
	}

	// add simple hazard
	const simpleHazardLevel = await fetchSelectedOrDefaultNumber(sageInteraction, createCustomId(args.customIdArgs, "simpleHazard"));
	if (simpleHazardLevel !== undefined) {
		encounter.simpleHazards.push(simpleHazardLevel);
	}

	// add complex hazard
	const complexHazardLevel = await fetchSelectedOrDefaultNumber(sageInteraction, createCustomId(args.customIdArgs, "complexHazard"));
	if (complexHazardLevel !== undefined) {
		encounter.complexHazards.push(complexHazardLevel);
	}

	// remove item
	const optionValue = await fetchSelectedOrDefault(sageInteraction, createCustomId(args.customIdArgs, "removeItem"));
	if (optionValue) {
		const { code, level } = parseEncounterItem(optionValue);
		if (code === "cr" && encounter.creatures.includes(level)) {
			encounter.creatures.splice(encounter.creatures.indexOf(level), 1);
		}else if (code === "sh" && encounter.simpleHazards.includes(level)) {
			encounter.simpleHazards.splice(encounter.simpleHazards.indexOf(level), 1);
		}else if (code === "ch" && encounter.complexHazards.includes(level)) {
			encounter.complexHazards.splice(encounter.complexHazards.indexOf(level), 1);
		}
	}

	await updateEncounter(sageInteraction, args);
}

async function resetEncounter(sageInteraction: SageInteraction<ButtonInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();

	const args = await getArgs(sageInteraction);
	if (!args) {
		const localize = sageInteraction.getLocalizer();
		return sageInteraction.replyStack.whisper({ content:localize("SORRY_WE_DONT_KNOW") });
	}

	await updateEncounter(sageInteraction, args);
}

async function updateEncounter(sageCommand: SageCommand, args: Args): Promise<void> {
	// const start = Date.now();

	const content = createContent(args);
	const components = buildFormOne(args);
	const options = sageCommand.resolveToOptions({ content, components });

	const [messageOne, messageTwo] = args.messages;
	await messageOne.edit(options).catch(warn);
	await messageTwo.edit({ content:ZERO_WIDTH_SPACE, components:buildFormTwo(args) }).catch(warn);

	// debug({getArgs:(Date.now()-start)});
}

async function deleteEncounter(sageCommand: SageCommand): Promise<void> {
	const localize = sageCommand.getLocalizer();

	const args = await getArgs(sageCommand);
	if (!args) {
		return sageCommand.replyStack.whisper({ content:localize("SORRY_WE_DONT_KNOW") });
	}

	for (const message of args.messages) {
		await deleteMessage(message);
	}
}

export function registerEncounterBuilder(): void {
	registerListeners({ commands:["encounter|builder"], handler:showEncounter });
	registerListeners({ commands:[/p20\|encounterBuilder\|\d{16,}\|\d{16,}\-\d{16,}\|(gameSystem|partyLevel|partySize|creature|simpleHazard|complexHazard|removeItem|verboseToggle)/], interaction:changeEncounter });
	registerListeners({ commands:[/p20\|encounterBuilder\|\d{16,}\|\d{16,}\-\d{16,}\|resetForm/], interaction:resetEncounter });
	registerListeners({ commands:[/p20\|encounterBuilder\|\d{16,}\|\d{16,}\-\d{16,}\|deleteForm/], interaction:deleteEncounter });
}