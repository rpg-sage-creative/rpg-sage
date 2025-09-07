import { DicePostType } from "@rsc-sage/types";
import { error, isWrapped, redactCodeBlocks, redactKeyValuePairs, redactMdLink, unwrap, wrap, type Optional } from "@rsc-utils/core-utils";
import type { SupportedMessagesChannel, SupportedTarget } from "@rsc-utils/discord-utils";
import { DiceOutputType, DiceSecretMethodType, processStatBlocks, type DiceCriticalMethodType, type GameSystemType } from "@rsc-utils/game-utils";
import type { TDiceOutput } from "../../../sage-dice/common.js";
import { DiscordDice } from "../../../sage-dice/dice/discord/index.js";
import { registerMessageListener } from "../../discord/handlers.js";
import type { TCommandAndArgsAndData } from "../../discord/index.js";
import type { CharacterManager } from "../model/CharacterManager.js";
import type { GameCharacter } from "../model/GameCharacter.js";
import type { DiceMacroBase, MacroBase } from "../model/Macro.js";
import type { SageCommand } from "../model/SageCommand.js";
import type { User } from "../model/User.js";
import { logPostCurrency } from "./admin/PostCurrency.js";
import { registerDiceTest } from "./dice/diceTest.js";
import { fetchTableFromUrl } from "./dice/fetchTableFromUrl.js";
import { formatDiceOutput } from "./dice/formatDiceOutput.js";
import { isMath } from "./dice/isMath.js";
import { isRandomItem } from "./dice/isRandomItem.js";
import { macroToDice } from "./dice/macroToDice.js";
import { parseTable } from "./dice/parseTable.js";
import { rollMath } from "./dice/rollMath.js";
import { rollRandomItem } from "./dice/rollRandomItem.js";
import { rollTable } from "./dice/rollTable.js";
import { sendDiceToMultiple } from "./dice/sendDiceToMultiple.js";
import { sendDiceToSingle } from "./dice/sendDiceToSingle.js";

type TDiscordDiceParseOptions = {
	gameSystemType?: GameSystemType;
	diceOutputType?: DiceOutputType;
	diceCritMethodType?: DiceCriticalMethodType;
	diceSecretMethodType?: DiceSecretMethodType;
};

export type TDiceMatch = {
	match: string;
	index: number;
	inline: boolean;
	output: TDiceOutput[];
};

//#region unified bracket command tests

//#region parse and map

function getBasicBracketRegex(): RegExp {
	// first regex takes priority, so it will find 2 or 1, but not 1 on left and 2 on right
	return /\[{2}[^\]]+\]{2}|\[[^\]]+\]/ig;
}

/** Used to prefetch stats and macros for characters so that the dice/macro logic can run synchronously */
async function prepStatsAndMacros(sageCommand: SageCommand) {
	const { game, isGameMaster, isPlayer, sageUser } = sageCommand;
	if (!game || isGameMaster || isPlayer) {
		const npcs = game?.nonPlayerCharacters ?? sageUser.nonPlayerCharacters;
		const pcs = game?.playerCharacters ?? sageUser.playerCharacters;
		/** @todo replace pc with "active character" */
		const pc = isPlayer && game ? sageCommand.playerCharacter : undefined;
		const encounters = game?.encounters;
		const macros = await fetchAllStatsAndMacros(npcs, pcs, pc, sageUser);
		return { npcs, pcs, pc, encounters, macros };
	}
	return undefined;
}

/** Iterates all the given characters to fetch their stats (dynamic tsv) and macros (dynamic tsv or dynamic pathbuilder); used only by prepStatsAndMacros() */
async function fetchAllStatsAndMacros(npcs: CharacterManager, pcs: CharacterManager, pc: Optional<GameCharacter>, sageUser: User): Promise<DiceMacroBase[]> {
	const out: DiceMacroBase[] = [];

	// active character first
	out.push(...await fetchStatsAndMacros(pc, sageUser));

	// other pcs next
	for (const _pc of pcs) {
		out.push(...await fetchStatsAndMacros(_pc, sageUser));
	}

	// npcs last
	for (const _npc of npcs) {
		out.push(...await fetchStatsAndMacros(_npc, sageUser));
	}

	return out;
}

/** Reusable logic used only by fetchAllStatsAndMacros() */
async function fetchStatsAndMacros(char: Optional<GameCharacter>, sageUser: User): Promise<DiceMacroBase[]> {
	const out: DiceMacroBase[] = [];
	if (!char) return out;

	const macros = [
		...await char.fetchMacros(),
		...(char.pathbuilder?.getAttackMacros() ?? []),
		...(char.pathbuilder?.getSpellMacros() ?? []),
	];

	// if the char belongs to the active user
	if (char.userDid === sageUser.did) {
		// check all the macros
		for (const macro of macros) {
			if (macro.dice) {
				// grab the macro if it has a unique name/category combo
				if (!out.some(m => macro.name.toLowerCase() === m.name.toLowerCase() && m.category === char.name)) {
					out.push({ name:macro.name, category:char.name, dice:macro.dice });
				}
			}
		}
	}

	// fetch from companions as well
	for (const companion of char.companions) {
		out.push(...await fetchStatsAndMacros(companion, sageUser));
	}

	return out;
}

async function parseDiscordDice(sageCommand: SageCommand, diceString: string, overrides?: TDiscordDiceParseOptions): Promise<DiscordDice | null> {
	if (!diceString) {
		return null;
	}

	const allCharacters = await prepStatsAndMacros(sageCommand);
	if (allCharacters) {
		diceString = processStatBlocks(diceString, allCharacters);
	}

	return DiscordDice.parse({
		diceString: diceString,
		defaultGameType: overrides?.gameSystemType ?? sageCommand.gameSystemType,
		defaultDiceOutputType: overrides?.diceOutputType ?? sageCommand.diceOutputType,
		defaultCritMethodType: overrides?.diceCritMethodType ?? sageCommand.diceCritMethodType,
		defaultDiceSecretMethodType: overrides?.diceSecretMethodType ?? sageCommand.diceSecretMethodType
	});
}

/** Returns macros from each tier, with the lowest index having the highest priority. */
function getTieredMacros(sageCommand: SageCommand): DiceMacroBase[][] {
	const stack: DiceMacroBase[][] = [];
	const push = (macros?: MacroBase[]) => {
		const diceMacros = macros?.filter(macro => macro.dice);
		if (diceMacros?.length) stack.push(diceMacros as DiceMacroBase[]);
	};
	push(sageCommand.playerCharacter?.macros);
	push(sageCommand.sageUser.macros);
	push(sageCommand.game?.macros);
	push(sageCommand.server?.macros);
	push(sageCommand.bot?.macros);
	return stack;
}

async function parseDiscordMacro(sageCommand: SageCommand, macroString: string, macroStack: string[] = []): Promise<TDiceOutput[] | null> {
	// allow SageMessage and SageInteraction, but not SageReaction
	if (sageCommand.isSageReaction()) {
		return null;
	}

	// get tiered macros
	const tieredMacros = getTieredMacros(sageCommand);

	// prep stats and fetch dynamic macros
	const statsAndMacros = await prepStatsAndMacros(sageCommand);

	// if we have more macros, unshift them to give them first priority
	if (statsAndMacros?.macros.length) {
		tieredMacros.unshift(statsAndMacros?.macros);
	}

	// find the macro
	const macroAndOutput = macroToDice(tieredMacros, unwrap(macroString, "[]"));
	if (macroAndOutput) {
		const { macro, output } = macroAndOutput;
		if (macroStack.includes(macro.name) && !isRandomItem(macroString)) {
			error(`Macro Recursion`, { macroString, macroStack });
			const parsedDice = await parseDiscordDice(sageCommand, `[0d0 Recursion!]`);
			return parsedDice?.roll().toStrings() ?? [];
		}

		const diceToParse = output.match(getBasicBracketRegex()) ?? [];

		const outputs: TDiceOutput[] = [];
		for (const dice of diceToParse) {
			if (!isRandomItem(dice)) {
				const diceMacroOutputs = await parseDiscordMacro(sageCommand, dice, macroStack.concat([macro.name]));
				if (diceMacroOutputs?.length) {
					outputs.push(...diceMacroOutputs);
					continue;
				}
			}
			const matchOutputs = await parseMatch(sageCommand, dice, { diceOutputType: DiceOutputType.XXL });
			if (matchOutputs?.length) {
				outputs.push(...matchOutputs);
			}
		}
		return outputs;
	}
	return null;
}

async function parseMatch(sageCommand: SageCommand, match: string, overrides?: TDiscordDiceParseOptions, tableIterations = 0): Promise<TDiceOutput[]> {
	const noBraces = unwrap(match, "[]");

	const table = await fetchTableFromUrl(match) ?? parseTable(match);
	if (table) {
		const tableResults = await rollTable(sageCommand, noBraces, table);
		const childDice = tableResults[0]?.children?.map(child => wrap(unwrap(child, "[]"), "[]").match(getBasicBracketRegex()) ?? []).flat() ?? [];
		// debug({tableResults,tableResultsDice})
		for (const diceToParse of childDice) {
			const childMatches = await parseMatch(sageCommand, diceToParse, overrides, tableIterations + 1);
			tableResults.push(...childMatches.flat());
		}
		return tableResults;
	}

	const dice = await parseDiscordDice(sageCommand, `[${noBraces}]`, overrides);
	if (dice) {
		// debug("dice", match);
		const diceSort = sageCommand.diceSortType === 2 ? "noSort" : sageCommand.diceSortType === 1 ? "sort" : undefined; // NOSONAR
		return dice.roll().toStrings(sageCommand.diceOutputType, diceSort);
	}
	if (isMath(match)) {
		// verbose("math", match);
		return rollMath(sageCommand, noBraces);
	}
	if (isRandomItem(match)) {
		// verbose("simple", match);
		return rollRandomItem(sageCommand, noBraces);
	}
	return [];
}

function redactContent(content: string): string {
	// use the existing logic for code blocks
	let redacted = redactCodeBlocks(content);

	// let's do key/value pairs if we have a command to avoid processing [] brackets in command options
	if (/^!+(\s*[\w-]+)+/i.test(redacted)) {
		redacted = redactKeyValuePairs(redacted);
	}

	// redact markdown links to get rid of the [] brackets
	redacted = redactMdLink(redacted);

	return redacted;
}

export async function parseDiceMatches(sageCommand: SageCommand, content: string): Promise<TDiceMatch[]> {
	const diceMatches: TDiceMatch[] = [];
	const redacted = redactContent(content);
	const regex = getBasicBracketRegex();
	let execArray: RegExpExecArray | null;
	while (execArray = regex.exec(redacted)) {
		const match = execArray[0];
		const index = execArray.index;
		const inline = isWrapped(match, "[[]]");
		const output = await parseDiscordMacro(sageCommand, content.slice(index, index + match.length))
			?? await parseMatch(sageCommand, content.slice(index, index + match.length));
		if (output.length) {
			diceMatches.push({ match, index, inline, output });
		}
	}
	return diceMatches;
}

//#endregion

//#region listener / handler

async function hasUnifiedDiceCommand(sageCommand: SageCommand): Promise<TCommandAndArgsAndData<TDiceOutput[]> | undefined> {
	if (!sageCommand.isSageMessage()) {
		return undefined;
	}
	if (!sageCommand.allowDice) {
		return undefined;
	}
	if (sageCommand.game && !(sageCommand.actor.canManageGames || sageCommand.isGameMaster || sageCommand.isPlayer)) {
		return undefined;
	}

	const matches = await parseDiceMatches(sageCommand, sageCommand.slicedContent);
	if (matches.length > 0) {
		const output = matches.map(m => m.output).flat();
		return { command: "unified-dice", data: output };
	}
	return undefined;
}

type TSendDiceResults = {
	allSecret: boolean;
	count: number;
	countPublic: number;
	countSecret: number;
	hasGmChannel: boolean;
	hasSecret: boolean;
};
export async function sendDice(sageCommand: SageCommand, outputs: TDiceOutput[]): Promise<TSendDiceResults> {
	const count = outputs.length,
		countSecret = outputs.filter(diceRollString => diceRollString.hasSecret).length,
		countPublic = count - countSecret,
		hasSecret = countSecret > 0,
		allSecret = countSecret === count,
		targetChannel = await ensureTargetChannel(sageCommand),
		gmTargetChannel = await ensureGmTargetChannel(sageCommand, hasSecret),
		hasGmChannel = !!gmTargetChannel,
		formattedOutputs = outputs.map(diceRoll => formatDiceOutput(sageCommand, diceRoll, !gmTargetChannel));
	if (sageCommand.dicePostType === DicePostType.MultipleEmbeds || sageCommand.dicePostType === DicePostType.MultiplePosts) {
		await sendDiceToMultiple(sageCommand, formattedOutputs, targetChannel, gmTargetChannel);
	}else {
		await sendDiceToSingle(sageCommand, formattedOutputs, targetChannel, gmTargetChannel);
	}
	if (count) {
		await logPostCurrency(sageCommand, "dice");
	}
	return { allSecret, count, countPublic, countSecret, hasGmChannel, hasSecret };
}

//#endregion

//#endregion

//#region dice


//#region Channels

async function ensureTargetChannel(sageCommand: SageCommand): Promise<SupportedMessagesChannel> {
	const channel = await sageCommand.sageCache.fetchChannel(sageCommand.channel?.sendDiceTo);
	if (channel) {
		return channel as SupportedMessagesChannel;
	}
	if (sageCommand.isSageInteraction("MESSAGE") || sageCommand.isSageInteraction("MODAL")) {
		return sageCommand.interaction.channel as SupportedMessagesChannel;
	}
	const message = await sageCommand.fetchMessage();
	return message!.channel as SupportedMessagesChannel;
}

async function ensureGmTargetChannel(sageCommand: SageCommand, hasSecret: boolean): Promise<Optional<SupportedTarget>> {
	if (!hasSecret || (sageCommand.diceSecretMethodType !== DiceSecretMethodType.GameMasterChannel && sageCommand.diceSecretMethodType !== DiceSecretMethodType.GameMasterDirect)) {
		return null;
	}
	if (sageCommand.diceSecretMethodType === DiceSecretMethodType.GameMasterChannel) {
		const validatedChannel = await sageCommand.game?.gmGuildChannel();
		const channel = validatedChannel?.discord;
		if (channel) {
			return channel as SupportedMessagesChannel;
		}
	}
	const member = await sageCommand.game?.gmGuildMember();
	return member?.user ?? null;
}

//#endregion


//#endregion

//#region macro


//#endregion

//#region dice test



//#endregion

export function registerDice(): void {
	registerDiceTest();
	registerMessageListener(hasUnifiedDiceCommand, sendDice as any, { priorityIndex:1 });
}
