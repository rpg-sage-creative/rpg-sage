import { DiceOutputType, DicePostType, DiceSecretMethodType, type DiceCritMethodType, type GameSystemType } from "@rsc-sage/types";
import type { Optional } from "@rsc-utils/core-utils";
import { error } from "@rsc-utils/core-utils";
import { processStatBlocks } from "@rsc-utils/dice-utils";
import { xRegExp } from "@rsc-utils/dice-utils/build/internal/xRegExp.js";
import { type MessageChannel, type MessageTarget } from "@rsc-utils/discord-utils";
import { createKeyValueArgRegex, createQuotedRegex, createWhitespaceRegex, dequote, isWrapped, parseKeyValueArg, redactCodeBlocks, tokenize, unwrap, wrap, type KeyValueArg } from '@rsc-utils/string-utils';
import type { ButtonInteraction } from "discord.js";
import type { TDiceOutput } from "../../../sage-dice/common.js";
import { DiscordDice } from "../../../sage-dice/dice/discord/index.js";
import { registerMessageListener } from "../../discord/handlers.js";
import type { TCommandAndArgsAndData } from "../../discord/index.js";
import type { CharacterManager } from "../model/CharacterManager.js";
import { GameCharacter } from "../model/GameCharacter.js";
import type { NamedCollection } from "../model/NamedCollection.js";
import { SageCommand } from "../model/SageCommand.js";
import { SageInteraction } from "../model/SageInteraction.js";
import { SageMessage } from "../model/SageMessage.js";
import type { TMacro, User } from "../model/User.js";
import { registerDiceTest } from "./dice/diceTest.js";
import { fetchTableFromUrl } from "./dice/fetchTableFromUrl.js";
import { formatDiceOutput } from "./dice/formatDiceOutput.js";
import { isMath } from "./dice/isMath.js";
import { isRandomItem } from "./dice/isRandomItem.js";
import { parseTable } from "./dice/parseTable.js";
import { rollMath } from "./dice/rollMath.js";
import { rollRandomItem } from "./dice/rollRandomItem.js";
import { rollTable } from "./dice/rollTable.js";
import { sendDiceToMultiple } from "./dice/sendDiceToMultiple.js";
import { sendDiceToSingle } from "./dice/sendDiceToSingle.js";

type TInteraction = SageMessage | SageInteraction;

type TGmChannel = Optional<MessageTarget>;

type TDiscordDiceParseOptions = {
	gameSystemType?: GameSystemType;
	diceOutputType?: DiceOutputType;
	diceCritMethodType?: DiceCritMethodType;
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

async function prepStatsAndMacros(sageCommand: TInteraction) {
	const { game, isGameMaster, isPlayer, sageUser } = sageCommand;
	if (!game || isGameMaster || isPlayer) {
		const npcs = game?.nonPlayerCharacters ?? sageUser.nonPlayerCharacters;
		const pcs = game?.playerCharacters ?? sageUser.playerCharacters;
		const pc = isPlayer && game ? sageCommand.playerCharacter : undefined;
		const encounters = game?.encounters;
		const macros = await fetchAllStatsAndMacros(npcs, pcs, pc, sageUser);
		return { npcs, pcs, pc, encounters, macros };
	}
	return undefined;
}
async function fetchAllStatsAndMacros(npcs: CharacterManager, pcs: CharacterManager, pc: Optional<GameCharacter>, sageUser: User): Promise<TMacro[]> {
	const out: TMacro[] = [];
	for (const npc of npcs) {
		out.push(...await fetchStatsAndMacros(npc, sageUser));
	}
	for (const pc of pcs) {
		out.push(...await fetchStatsAndMacros(pc, sageUser));
	}
	await fetchStatsAndMacros(pc, sageUser);
	return out;
}
async function fetchStatsAndMacros(char: Optional<GameCharacter>, sageUser: User): Promise<TMacro[]> {
	const out: TMacro[] = [];
	if (!char) return out;

	const macros = await char.fetchMacros();
	if (char.userDid === sageUser.did) {
		for (const macro of macros) {
			if (!out.some(m => macro.name.toLowerCase() === m.name.toLowerCase() && m.category === char.name)) {
				out.push({ name:macro.name, category:char.name, dice:macro.dice });
			}
		}
	}

	for (const companion of char.companions) {
		out.push(...await fetchStatsAndMacros(companion, sageUser));
	}

	return out;
}

async function parseDiscordDice(sageCommand: TInteraction, diceString: string, overrides?: TDiscordDiceParseOptions): Promise<DiscordDice | null> {
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

async function parseDiscordMacro(sageCommand: SageCommand, macroString: string, macroStack: string[] = []): Promise<TDiceOutput[] | null> {
	if (!sageCommand.isSageMessage()) {
		return null;
	}

	const statsAndMacros = await prepStatsAndMacros(sageCommand);
	const tsvMacros = statsAndMacros?.macros ?? [];
	const macroAndOutput = macroToDice(sageCommand.sageUser.macros.concat(tsvMacros), unwrap(macroString, "[]"));
	if (macroAndOutput) {
		const { macro, output } = macroAndOutput;
		if (macroStack.includes(macro.name) && !isRandomItem(macroString)) {
			error(`Macro Recursion`, { macroString, macroStack });
			const parsedDice = await parseDiscordDice(sageCommand, `[1d1 Recursion!]`);
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

async function parseMatch(sageMessage: TInteraction, match: string, overrides?: TDiscordDiceParseOptions, tableIterations = 0): Promise<TDiceOutput[]> {
	const noBraces = unwrap(match, "[]");

	const table = await fetchTableFromUrl(match) ?? parseTable(match);
	if (table) {
		const tableResults = await rollTable(sageMessage, noBraces, table);
		const childDice = tableResults[0]?.children?.map(child => wrap(unwrap(child, "[]"), "[]").match(getBasicBracketRegex()) ?? []).flat() ?? [];
		// debug({tableResults,tableResultsDice})
		for (const diceToParse of childDice) {
			const childMatches = await parseMatch(sageMessage, diceToParse, overrides, tableIterations + 1);
			tableResults.push(...childMatches.flat());
		}
		return tableResults;
	}

	const dice = await parseDiscordDice(sageMessage, `[${noBraces}]`, overrides);
	if (dice) {
		// debug("dice", match);
		const diceSort = sageMessage.diceSortType === 2 ? "noSort" : sageMessage.diceSortType === 1 ? "sort" : undefined; // NOSONAR
		return dice.roll().toStrings(sageMessage.diceOutputType, diceSort);
	}
	if (isMath(match)) {
		// verbose("math", match);
		return rollMath(sageMessage, noBraces);
	}
	if (isRandomItem(match)) {
		// verbose("simple", match);
		return rollRandomItem(sageMessage, noBraces);
	}
	return [];
}

function redactContent(content: string): string {
	// use the existing logic for code blocks
	let redacted = redactCodeBlocks(content);

	// let's do key/value pairs if we have a command
	if (/^!+(\s*[\w-]+)+/i.test(redacted)) {
		const tokens = tokenize(redacted, { keyValue:createKeyValueArgRegex() });
		const redactedTokens = tokens.map(({ key, token }) => key === "keyValue" ? "".padEnd(token.length, "*") : token);
		redacted = redactedTokens.join("");
	}

	// let's redact links
	const linkRegex = xRegExp(`
		\\[
			[^\\]]+
		\\]
		\\(
			(
			<(s?ftp|https?)://[^\\)]+>
			|
			(s?ftp|https?)://[^\\)]+
			)
		\\)
	`, "gix");
	redacted = redacted.replace(linkRegex, link => "".padEnd(link.length, "*"));

	return redacted;
}

export async function parseDiceMatches(sageMessage: TInteraction, content: string): Promise<TDiceMatch[]> {
	const diceMatches: TDiceMatch[] = [];
	const redacted = redactContent(content);
	const regex = getBasicBracketRegex();
	let execArray: RegExpExecArray | null;
	while (execArray = regex.exec(redacted)) {
		const match = execArray[0];
		const index = execArray.index;
		const inline = isWrapped(match, "[[]]");
		const output = await parseDiscordMacro(sageMessage, content.slice(index, index + match.length))
			?? await parseMatch(sageMessage, content.slice(index, index + match.length));
		if (output.length) {
			diceMatches.push({ match, index, inline, output });
		}
	}
	return diceMatches;
}

//#endregion

//#region listener / handler

async function hasUnifiedDiceCommand(sageMessage: SageMessage): Promise<TCommandAndArgsAndData<TDiceOutput[]> | undefined> {
	if (!sageMessage.allowDice) {
		return undefined;
	}
	if (sageMessage.game && !(sageMessage.isGameMaster || sageMessage.isPlayer)) {
		return undefined;
	}

	const matches = await parseDiceMatches(sageMessage, sageMessage.slicedContent);
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
export async function sendDice(sageMessage: TInteraction, outputs: TDiceOutput[]): Promise<TSendDiceResults> {
	const count = outputs.length,
		countSecret = outputs.filter(diceRollString => diceRollString.hasSecret).length,
		countPublic = count - countSecret,
		hasSecret = countSecret > 0,
		allSecret = countSecret === count,
		targetChannel = await ensureTargetChannel(sageMessage),
		gmTargetChannel = await ensureGmTargetChannel(sageMessage, hasSecret),
		hasGmChannel = !!gmTargetChannel,
		formattedOutputs = outputs.map(diceRoll => formatDiceOutput(sageMessage, diceRoll, !gmTargetChannel));
	if (sageMessage.dicePostType === DicePostType.MultipleEmbeds || sageMessage.dicePostType === DicePostType.MultiplePosts) {
		await sendDiceToMultiple(sageMessage, formattedOutputs, targetChannel, gmTargetChannel);
	}else {
		await sendDiceToSingle(sageMessage, formattedOutputs, targetChannel, gmTargetChannel);
	}
	return { allSecret, count, countPublic, countSecret, hasGmChannel, hasSecret };
}

//#endregion

//#endregion

//#region dice


//#region Channels

async function ensureTargetChannel(sageMessage: TInteraction): Promise<MessageChannel> {
	const channel = await sageMessage.sageCache.fetchChannel(sageMessage.channel?.sendDiceTo);
	if (channel) {
		return channel as MessageChannel;
	}
	if (sageMessage instanceof SageInteraction) {
		return (sageMessage.interaction as ButtonInteraction).channel as MessageChannel;
	}
	return sageMessage.message.channel as MessageChannel;
}

async function ensureGmTargetChannel(sageMessage: TInteraction, hasSecret: boolean): Promise<TGmChannel> {
	if (!hasSecret || (sageMessage.diceSecretMethodType !== DiceSecretMethodType.GameMasterChannel && sageMessage.diceSecretMethodType !== DiceSecretMethodType.GameMasterDirect)) {
		return null;
	}
	if (sageMessage.diceSecretMethodType === DiceSecretMethodType.GameMasterChannel) {
		const channel = await sageMessage.game?.gmGuildChannel();
		if (channel) {
			return channel as MessageChannel;
		}
	}
	const member = await sageMessage.game?.gmGuildMember();
	return member?.user ?? null;
}

//#endregion


//#endregion

//#region macro

function reduceToLongestMacroName(longestMacro: TMacro | null, currentMacro: TMacro): TMacro | null {
	if (!longestMacro || longestMacro.name.length < currentMacro.name.length) {
		return currentMacro;
	}
	return longestMacro;
}

type TPrefix = {
	count: number;
	keepRolls?: string;
	/** "kh" | "kl" */
	keep?: string;
	keepCount?: string;
	/** "-" | "+"; */
	fortune?: string;
};
function parsePrefix(prefix: string): TPrefix {
	const [_, count, keepDirty, fortune] = prefix.match(/^(?:(?:(\d*)#)|(?:(\d*k[hl]\d*)#)|([\+\-]))/i) ?? ["1"];
	if (keepDirty) {
		const [__, keepRolls, keep, keepCount] = keepDirty.match(/^(\d*)(k[hl])(\d*)$/)!;
		return {
			count: 1,
			keepRolls: keepRolls ? keepRolls : undefined,
			keep,
			keepCount: keepCount ? keepCount : undefined
		};
	}else if (fortune) {
		return { count: 1, fortune };
	}else if (count) {
		return { count: +count };
	}
	return { count:1 };
}

/** returns [cleanPrefix, TMacro, slicedArgs] */
function findPrefixMacroArgs(userMacros: NamedCollection<TMacro>, input: string): [string, TMacro | null, string] {
	const lower = input.toLowerCase();
	const [_, dirtyPrefix, dirtyMacro] = lower.match(/^((?:\d*#)|(?:\d*k[hl]\d*#)|(?:[\+\-]))?(.*?)$/) ?? [];
	const cleanPrefix = (dirtyPrefix ?? "").trim();
	const cleanMacro = (dirtyMacro ?? "").trim();
	const matchingMacros = userMacros.filter(userMacro => cleanMacro.startsWith(userMacro.name.toLowerCase()));
	const macro = matchingMacros.reduce(reduceToLongestMacroName, null);
	let sliceIndex = (dirtyPrefix ?? "").length;
	if (macro) {
		sliceIndex = lower.indexOf(macro.name.toLowerCase()) + macro.name.length;
	}
	const slicedArgs = input.slice(sliceIndex);
	return [cleanPrefix, macro, slicedArgs];
}

type TArgs = { indexed:string[]; named:KeyValueArg[] };
function parseMacroArgs(argString: string): TArgs {
	const parsers = {
		spaces: createWhitespaceRegex(),
		named: createKeyValueArgRegex(),
		quotes: createQuotedRegex({lengthQuantifier:"*"})
	};
	const tokens = tokenize(argString.trim(), parsers);
	const named = tokens
		.filter(token => token.key === "named")
		.map(token => parseKeyValueArg(token.token)!);
	const indexed = tokens
		.filter(token => !["spaces", "named"].includes(token.key))
		.map(token => dequote(token.token).trim());
	return { indexed, named };
}

type TMacroAndArgs = TArgs & { macro?: TMacro; prefix: TPrefix; };
function parseMacroAndArgs(userMacros: NamedCollection<TMacro>, input: string): TMacroAndArgs {
	const [prefix, userMacro, slicedArgs] = findPrefixMacroArgs(userMacros, input);
	const macroArgs = userMacro ? parseMacroArgs(slicedArgs) : null;
	return {
		indexed: macroArgs?.indexed ?? [],
		macro: userMacro ?? undefined,
		named: macroArgs?.named ?? [],
		prefix: parsePrefix(prefix)
	};
}

function nonEmptyStringOrDefaultValue(arg: Optional<string>, def: Optional<string>): string {
	const argOrEmptyString = arg ?? "";
	const defOrEmptyString = def ?? "";
	return argOrEmptyString !== "" ? argOrEmptyString : defOrEmptyString;
}

function namedArgValueOrDefaultValue(arg: Optional<KeyValueArg>, def: Optional<string>): string {
	if (arg) {
		const value = nonEmptyStringOrDefaultValue(arg.value, def);
		if (arg.keyLower.match(/^(ac|dc|vs)$/) && value) {
			return arg.key + value;
		}
		return value;
	}
	return def ?? "";
}

function splitKeyValueFromBraces(input: string): [string, string] {
	const debraced = input.slice(1, -1);
	const sliceIndex = debraced.indexOf(":");
	if (sliceIndex < 0) {
		return [debraced, ""];
	}
	const key = debraced.slice(0, sliceIndex);
	const value = debraced.slice(sliceIndex + 1);
	return [key, value];
}

type TMacroAndOutput = { macro: TMacro; output: string; };
function macroToDice(userMacros: NamedCollection<TMacro>, input: string): TMacroAndOutput | null {
	const { prefix, macro, indexed, named } = parseMacroAndArgs(userMacros, input);
	if (!macro) {
		return null;
	}

	let maxIndex = -1;
	let dice = macro.dice
		// indexed args
		.replace(/\{(\d+)(:(?!:)([-+]?\d+))?\}/g, match => {
			const [argIndex, defaultValue] = splitKeyValueFromBraces(match);
			maxIndex = Math.max(maxIndex, +argIndex);
			return nonEmptyStringOrDefaultValue(indexed[+argIndex], defaultValue);
		})
		// named args
		.replace(/\{(\w+)(:(?!:)[^}]+)?\}/ig, match => {
			const [argName, defaultValue] = splitKeyValueFromBraces(match);
			const argNameLower = argName.toLowerCase();
			const namedArg = named.find(arg => arg.keyLower === argNameLower);
			return namedArgValueOrDefaultValue(namedArg, defaultValue);
		})
		// remaining args
		.replace(/\{\.{3}\}/g, indexed.slice(maxIndex + 1).join(" "))
		// fix adjacent plus/minus
		.replace(/-\s*\+/g, "-")
		.replace(/\+\s*-/g, "-")
		.replace(/\+\s*\+/g, "+")
		;

	if (prefix.keep) {
		dice = dice.replace(/(\d*)([dD]\d+)/, (_, dCount, dSize) =>
			`${prefix.keepRolls ?? dCount}${dSize}${prefix.keep}${prefix.keepCount ?? ""}`
		);
	}else if (prefix.fortune) {
		dice = dice.replace("1d20", `${prefix.fortune}2d20`);
	}

	const output = [dice];
	while (output.length < prefix.count) {
		output.push(dice);
	}

	return {
		macro: macro,
		output: output.join("")
	};
}

//#endregion

//#region dice test



//#endregion

export function registerDice(): void {
	registerDiceTest();
	registerMessageListener(hasUnifiedDiceCommand, sendDice as any, { priorityIndex:1 });
}
