import { debug, error } from "@rsc-utils/console-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type * as Discord from "discord.js";
import type { GameType } from "../../../sage-common";
import { DiceOutputType, DiceSecretMethodType, DiscordDice, TDiceOutput } from "../../../sage-dice";
import { NEWLINE } from "../../../sage-pf2e";
import type { TKeyValueArg } from "../../../sage-utils";
import { createMessageLink } from "../../../sage-utils/utils/DiscordUtils/createMessageLink";
import { toHumanReadable } from "../../../sage-utils/utils/DiscordUtils/humanReadable";
import { addCommas } from "../../../sage-utils/utils/NumberUtils";
import { random, randomItem } from "../../../sage-utils/utils/RandomUtils";
import { Tokenizer, chunk, createKeyValueArgRegex, createQuotedRegex, createWhitespaceRegex, dequote, isNotBlank, parseKeyValueArg, redactCodeBlocks } from "../../../sage-utils/utils/StringUtils";
import type { DUser, TChannel, TCommandAndArgsAndData } from "../../discord";
import { DiscordId, DiscordMaxValues } from "../../discord";
import { createMessageEmbed } from "../../discord/embeds";
import { registerMessageListener } from "../../discord/handlers";
import { sendTo } from "../../discord/messages";
import CharacterManager from "../model/CharacterManager";
import type { CharacterShell } from "../model/CharacterShell";
import { GameUserType } from "../model/Game";
import GameCharacter from "../model/GameCharacter";
import { ColorType } from "../model/HasColorsCore";
import type NamedCollection from "../model/NamedCollection";
import SageInteraction from "../model/SageInteraction";
import SageMessage from "../model/SageMessage";
import type { TMacro } from "../model/User";
import { registerCommandRegex } from "./cmd";
import { registerInlineHelp } from "./help";
import type { EncounterManager } from "./trackers/encounter/EncounterManager";

type TInteraction = SageMessage | SageInteraction;

type TGmChannel = Optional<TChannel | DUser>;

// type TDiceOutput = {
// 	hasSecret: boolean;
// 	inlineOutput: string;
// 	input: string,
// 	output: string;
// };

export enum DicePostType { SinglePost = 0, SingleEmbed = 1, MultiplePosts = 2, MultipleEmbeds = 3 }
// export enum DiceSecretMethodType { Ignore = 0, Hide = 1, GameMasterChannel = 2, GameMasterDirect = 3 }
type TFormattedDiceOutput = {
	hasSecret: boolean;
	postContent?: string;
	embedContent?: string;
	notificationContent: string;
};

type TDiscordDiceParseOptions = {
	gameType?: GameType;
	diceOutputType?: DiceOutputType;
	critMethodType?: number;
	diceSecretMethodType?: DiceSecretMethodType;
};

type TDiceMatch = {
	match: string;
	index: number;
	inline: boolean;
	output: TDiceOutput[];
};

//#region unified bracket command tests

//#region parse and map

const BASE_REGEX = /\[+[^\]]+\]+/ig;
const MATH_REGEX = /\[[ \d\+\-\*\/\(\)\^]+[\+\-\*\/\^]+[ \d\+\-\*\/\(\)\^]+\]/i;
const RANDOM_REGEX = /\[(\d+[usgm]*#)?([^,\]]+)(,([^,\]]+))+\]/i;

type ReplaceStatsArgs = {
	/** /\{(\w+):{2}([^:}]+)(?::([^}]+))?\}/i */
	statRegex: RegExp;
	/** /^(pc|stat)?(companion|hireling|alt|familiar)?$/i */
	typeRegex: RegExp;
	npcs: CharacterManager;
	pcs: CharacterManager;
	pc?: GameCharacter | null;
	encounters?: EncounterManager;
};
function replaceStats(diceString: string, args: ReplaceStatsArgs, stack: string[] = []): string {
	const replaced = diceString.replace(new RegExp(args.statRegex, "gi"), match => {
		const [_, name, stat, defaultValue] = args.statRegex.exec(match) ?? [];

		// check stack for recursion
		const stackValue = `${name}::${stat}`.toLowerCase();
		if (stack.includes(stackValue)) {
			return "`" + match + "`";
		}

		// get character
		let char: GameCharacter | CharacterShell | null = null;
		if (name) {
			const [isPc, isAlt] = args.typeRegex.exec(name) ?? [];
			if (isPc) {
				char = args.pc ?? null;
			}else if (isAlt) {
				char = args.pc?.companions[0] ?? null;
			}else {
				char = args.pcs.findByName(name)
					?? args.pcs.findCompanionByName(name)
					?? args.npcs.findByName(name)
					?? args.npcs.findCompanionByName(name)
					?? args.encounters?.findActiveChar(name)
					?? null;
			}
		}else {
			char = args.pc ?? null;
		}

		// get stat
		const statVal = char?.getStat(stat);
		const statValue = statVal ?? defaultValue?.trim() ?? "";
		if (statValue.length) {
			// check for nested stat block
			if (args.statRegex.test(statValue)) {
				return replaceStats(statValue, args, stack.concat([stackValue]));
			}
			return statValue;
		}

		// return escaped match
		return "`" + match + "`";
	});

	// check for piped "hidden" values
	const hasPipes = (/\|{2}[^|]+\|{2}/).test(replaced);
	const unpiped = replaced.replace(/\|{2}/g, "");
	if (MATH_REGEX.test(`[${unpiped}]`)) {
		const value = _doMath(unpiped);
		if (value !== null) {
			return hasPipes ? `||${value}||` : value;
		}
	}

	// return updated value
	return replaced;
}
function parseDiscordDice(sageMessage: TInteraction, diceString: string, overrides?: TDiscordDiceParseOptions): DiscordDice | null {
	if (!diceString) {
		return null;
	}

	const statRegex = /\{([\w ]+|"[\w ]+"):{2}([^:}]+)(?::([^}]+))?\}/i;
	if (statRegex.test(diceString)) {
		const { game, isGameMaster, isPlayer } = sageMessage;
		if (!game || isGameMaster || isPlayer) {
			const npcs = game?.nonPlayerCharacters ?? sageMessage.sageUser.nonPlayerCharacters;
			const pcs = game?.playerCharacters ?? sageMessage.sageUser.playerCharacters;
			const pc = isPlayer && game ? sageMessage.playerCharacter : null;
			const encounters = game?.encounters;
			const typeRegex = /^(pc|stat)?(companion|hireling|alt|familiar)?$/i;
			diceString = replaceStats(diceString, { statRegex, typeRegex, npcs, pcs, pc, encounters });
		}
	}

	return DiscordDice.parse({
		diceString: diceString,
		defaultGameType: overrides?.gameType ?? sageMessage.gameType,
		defaultDiceOutputType: overrides?.diceOutputType ?? sageMessage.diceOutputType,
		defaultCritMethodType: overrides?.critMethodType ?? sageMessage.critMethodType,
		defaultDiceSecretMethodType: overrides?.diceSecretMethodType ?? sageMessage.diceSecretMethodType
	});
}

function parseDiscordMacro(sageMessage: TInteraction, macroString: string, macroStack: string[] = []): TDiceOutput[] | null {
	if (!(sageMessage instanceof SageMessage)) return null;

	const macroAndOutput = macroToDice(sageMessage.sageUser.macros, debrace(macroString));
	if (macroAndOutput) {
		const { macro, output } = macroAndOutput;
		if (macroStack.includes(macro.name)) {
			error(`Macro Recursion`, { macroString, macroStack });
			return parseDiscordDice(sageMessage, `[1d1 Recursion!]`)?.roll().toStrings() ?? [];
		}

		const diceToParse = output.match(BASE_REGEX) ?? [];

		return diceToParse.map(dice =>
			parseDiscordMacro(sageMessage, dice, macroStack.concat([macro.name]))
			?? parseMatch(sageMessage, dice, { diceOutputType: DiceOutputType.XXL })
		).flat();
	}
	return null;
}

/** Removes all braces: [] or [[]]  */
function debrace(input: string): string {
	while (input.startsWith("[") && input.endsWith("]")) {
		input = input.slice(1, -1);
	}
	return input;
}

function parseMatch(sageMessage: TInteraction, match: string, overrides?: TDiscordDiceParseOptions): TDiceOutput[] {
	const noBraces = debrace(match);
	const dice = parseDiscordDice(sageMessage, `[${noBraces}]`, overrides);
	if (dice) {
		// debug("dice", match);
		return dice.roll().toStrings(sageMessage.diceOutputType);
	}
	if (match.match(RANDOM_REGEX)) {
		// verbose("simple", match);
		return doSimple(sageMessage, noBraces);
	}
	if (match.match(MATH_REGEX)) {
		// verbose("math", match);
		return doMath(sageMessage, noBraces);
	}
	return [];
}

export function parseDiceMatches(sageMessage: TInteraction, content: string): TDiceMatch[] {
	const diceMatches: TDiceMatch[] = [];
	const withoutCodeBlocks = redactCodeBlocks(content);
	const regex = new RegExp(BASE_REGEX);
	let execArray: RegExpExecArray | null;
	while (execArray = regex.exec(withoutCodeBlocks)) {
		const match = execArray[0];
		const index = execArray.index;
		const inline = match.match(/^\[{2}/) && match.match(/\]{2}$/) ? true : false;
		const output = parseDiscordMacro(sageMessage, content.slice(index, index + match.length)) ?? parseMatch(sageMessage, content.slice(index, index + match.length));
		if (output.length) {
			diceMatches.push({ match, index, inline, output });
		}
	}
	return diceMatches;
}

//#endregion

//#region listener / handler

async function hasUnifiedDiceCommand(sageMessage: SageMessage): Promise<TCommandAndArgsAndData<TDiceOutput[]> | null> {
	if (!sageMessage.allowDice) return null;
	if (sageMessage.slicedContent.match(/^\!*\s*((add|set)[ \-]?macro|macro[ \-]?(add|set))/i)) {
		return null;
	}
	if (sageMessage.slicedContent.match(/^\!*\s*((add|set)[ \-]?alias|alias[ \-]?(add|set))/i)) {
		return null;
	}
	if (sageMessage.game && !(sageMessage.isGameMaster || sageMessage.isPlayer)) {
		return null;
	}

	const matches = parseDiceMatches(sageMessage, sageMessage.slicedContent);
	if (matches.length > 0) {
		const output = matches.map(m => m.output).flat();
		return { command: "unified-dice", data: output };
	}
	return null;
}

async function sendDiceToMultiple(sageMessage: TInteraction, formattedOutputs: TFormattedDiceOutput[], targetChannel: TChannel, gmTargetChannel: TGmChannel): Promise<void> {
	const hasSecret = formattedOutputs.filter(output => output.hasSecret).length > 0,
		allSecret = formattedOutputs.filter(output => output.hasSecret).length === formattedOutputs.length,
		publicMentionLine = await createMentionLine(sageMessage),
		secretMentionLine = await createMentionLine(sageMessage, true),
		secretReferenceLink = sageMessage instanceof SageMessage ? createMessageLink(sageMessage.message) : ``,
		sageCache = sageMessage.caches;

	let doGmMention = hasSecret && !!gmTargetChannel;
	let doMention = !allSecret;

	for (const formattedOutput of formattedOutputs) {
		const embed = createEmbedOrNull(sageMessage, formattedOutput.embedContent);
		const embeds = embed ? [embed] : [];
		// figure out where to send results and info about secret rolls
		if (formattedOutput.hasSecret && gmTargetChannel) {
			// prepend the mention if we haven't done so yet; stop us from doing it again; send the message
			const gmPostContent = doGmMention ? `${secretMentionLine}\n${formattedOutput.postContent}` : formattedOutput.postContent!;
			doGmMention = false;
			await sendTo({ target: gmTargetChannel, content: gmPostContent.trim(), embeds, sageCache });

			if (!allSecret) {
				// prepend the mention if we haven't done so yet; stop use from doing it again; send the message
				const notificationContent = doMention ? `${publicMentionLine} ${secretReferenceLink}\n${formattedOutput.notificationContent}` : formattedOutput.notificationContent;
				doMention = false;
				await sendTo({ target: targetChannel, content: notificationContent.trim(), sageCache });
			}
		} else {
			// prepend the mention if we haven't done so yet; stop use from doing it again; send the message
			const postContent = doMention ? `${publicMentionLine}\n${formattedOutput.postContent}` : formattedOutput.postContent!;
			doMention = false;
			await sendTo({ target: targetChannel, content: postContent.trim(), embeds, sageCache });
		}
	}
	if (allSecret && sageMessage instanceof SageMessage) {
		await sageMessage.reactDie();
	}
}

async function sendDiceToSingle(sageMessage: TInteraction, formattedOutputs: TFormattedDiceOutput[], targetChannel: TChannel, gmTargetChannel: TGmChannel): Promise<void> {
	const hasSecret = formattedOutputs.filter(output => output.hasSecret).length > 0,
		allSecret = formattedOutputs.filter(output => output.hasSecret).length === formattedOutputs.length,
		publicMentionLine = await createMentionLine(sageMessage),
		secretMentionLine = await createMentionLine(sageMessage, true),
		secretReferenceLink = sageMessage instanceof SageMessage ? createMessageLink(sageMessage.message) : ``;

	const gmPostContents: Optional<string>[] = [];
	const gmEmbedContents: Optional<string>[] = [];
	const mainPostContents: Optional<string>[] = [];
	const mainEmbedContents: Optional<string>[] = [];

	if (hasSecret && gmTargetChannel) {
		gmPostContents.push(`${secretMentionLine} ${secretReferenceLink}`);
	}
	if (!allSecret) {
		mainPostContents.push(publicMentionLine);
	}

	for (const formattedOutput of formattedOutputs) {
		// figure out where to send results and info about secret rolls
		if (formattedOutput.hasSecret && gmTargetChannel) {
			gmPostContents.push(formattedOutput.postContent);
			gmEmbedContents.push(formattedOutput.embedContent);
			if (!allSecret) {
				mainPostContents.push(formattedOutput.notificationContent);
			}
		} else {
			mainPostContents.push(formattedOutput.postContent);
			mainEmbedContents.push(formattedOutput.embedContent);
		}
	}

	const gmPostContent = gmPostContents.filter(isNotBlank).join(NEWLINE);
	const gmEmbedContent = gmEmbedContents.filter(isNotBlank).join(NEWLINE);
	if (gmPostContent || gmEmbedContent) {
		if (gmTargetChannel) {
			await _sendTo(sageMessage, gmTargetChannel, gmPostContent, gmEmbedContent);
		}else {
			debug("no gmTargetChannel!");
		}
	}

	const mainPostContent = mainPostContents.filter(isNotBlank).join(NEWLINE);
	const mainEmbedContent = mainEmbedContents.filter(isNotBlank).join(NEWLINE);
	if (mainPostContent || mainEmbedContent) {
		if (targetChannel) {
			await _sendTo(sageMessage, targetChannel, mainPostContent, mainEmbedContent);
		}else {
			debug("no targetChannel!");
		}
	}

	if (allSecret && sageMessage instanceof SageMessage) {
		await sageMessage.reactDie();
	}
}

function createDiceOutputEmbeds(sageMessage: TInteraction, embedContent?: string): Discord.MessageEmbed[] {
	if (embedContent) {
		const chunks = chunk(embedContent, DiscordMaxValues.embed.totalLength);
		return chunks.map(chunk => createMessageEmbed("", chunk, sageMessage.toDiscordColor(ColorType.Dice)));
	}
	return [];
}

async function _sendTo(sageMessage: TInteraction, target: TChannel | DUser, postContent: string, embedContent: string): Promise<void> {
	const sageCache = sageMessage.caches;
	const _embeds = createDiceOutputEmbeds(sageMessage, embedContent);
	const _chunks = chunk(postContent, DiscordMaxValues.message.contentLength);
	while (_chunks.length) {
		// if last chunk and we have embeds, grab the first embed
		const embeds = _chunks.length === 1 && _embeds.length > 0 ? [_embeds.shift()!] : [];
		const content = _chunks.shift();
		await sendTo({ target, content, embeds, sageCache });
	}
	for (const embed of _embeds) {
		const embeds = [embed];
		const content = "";
		await sendTo({ target, content, embeds, sageCache });
	}
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
function _doMath(noBraces: string): string | null {
	try {
		if (noBraces.match(/^[\s\(\)\d\*\/\+\-\^]+$/i)) {
			const equation = noBraces
				.replace(/ /g, "")
				.replace(/(\d+)\(([^)]+)\)/g, "($1*($2))")
				.replace(/(\d)\(/g, "$1*(")
				.replace(/\^/g, "**")
				;
			return String(eval(equation));
		}
	} catch (ex) {
		/* ignore */
	}
	return null;
}
function doMath(_: TInteraction, input: string): TDiceOutput[] {
	const result = _doMath(input) ?? "INVALID!";
	return [{
		hasSecret: false,
		inlineOutput: result,
		input: input,
		output: `${result} ${"\u27f5"} ${input.replace(/\*/g, "\\*")}`
	}];
}

function doSimple(_: TInteraction, input: string): TDiceOutput[] {
	const match = input.match(/^(?:(\d*)([ usgm]*)#)?(.*?)$/i) ?? [];
	const count = +match[1] || 1;
	const unique = !!(match[2] ?? "").match(/u/i);
	const sort = !!(match[2] ?? "").match(/s/i);
	const hasSecret = !!(match[2] ?? "").match(/gm/i);
	const options = (match[3] ?? "").split(",").map(s => s.trim());
	const selections: string[] = [];
	const total = (unique ? Math.min(options.length, count) : count);
	do {
		const random = randomItem(options)!;
		if (!unique || !selections.includes(random)) {
			selections.push(random);
		}
	} while (selections.length < total);
	if (sort) {
		selections.sort();
	}
	return [{
		hasSecret: hasSecret,
		inlineOutput: selections.join(", "),
		input: input,
		output: `${selections.join(", ")} ${"\u27f5"} ${input}`
	}];
}

//#endregion

//#endregion

//#region dice

//#region Message

function formatDiceOutput(sageMessage: TInteraction, diceRoll: TDiceOutput, noGmTargetChannel: boolean): TFormattedDiceOutput {
	const formatted = sageMessage.caches.format(diceRoll.output),
		output = diceRoll.hasSecret && (sageMessage.diceSecretMethodType === DiceSecretMethodType.Hide || noGmTargetChannel) ? `||${formatted}||` : formatted,
		isEmbed = sageMessage.dicePostType === DicePostType.SingleEmbed || sageMessage.dicePostType === DicePostType.MultipleEmbeds
		;
	return {
		hasSecret: diceRoll.hasSecret,
		postContent: isEmbed ? undefined : output,
		embedContent: isEmbed ? output : undefined,
		notificationContent: sageMessage.caches.format(`${diceRoll.input} [die]`)
	};
}

function createEmbedOrNull(sageMessage: TInteraction, embedContent?: string): Discord.MessageEmbed | null {
	return embedContent ? createMessageEmbed("", embedContent, sageMessage.toDiscordColor(ColorType.Dice)) : null;
}

//#endregion

//#region Mentions

function createGmMention(sageMessage: TInteraction): string {
	const game = sageMessage.game;
	if (!game) {
		return "";
	}

	const gmRole = game.gmRole;
	if (gmRole) {
		return gmRole.dicePing ? DiscordId.toRoleMention(gmRole.did) ?? "" : "";
	}

	const gameUser = game.users.find(user => user.type === GameUserType.GameMaster && user.dicePing !== false);
	return DiscordId.toUserMention(gameUser?.did) ?? "";
}

async function createAuthorMention(sageMessage: TInteraction, isSecretMention = false): Promise<string | null> {
	const userDid = sageMessage instanceof SageMessage ? sageMessage.authorDid : sageMessage.user.id;
	const gameUser = sageMessage.game?.getUser(userDid);
	if (!gameUser) {
		return DiscordId.toUserMention(userDid);
	}

	let authorReference = DiscordId.toUserMention(gameUser.did);
	if (isSecretMention || gameUser.dicePing === false) {
		const user = await sageMessage.discord.fetchUser(userDid);
		authorReference = toHumanReadable(user);
	}
	if (sageMessage.playerCharacter) {
		authorReference = authorReference
			? `${authorReference} (${sageMessage.playerCharacter.name})`
			: sageMessage.playerCharacter.name;
	}
	return authorReference;
}

async function createMentionLine(sageMessage: TInteraction, isSecretMention = false/*, hasSecret:boolean, isTargetChannel: boolean, isGmChannel: boolean, isGmUser: boolean*/): Promise<string | null> {
	const gmMention = createGmMention(sageMessage);
	if (sageMessage.isGameMaster) {
		return gmMention;
	}
	const authorMention = await createAuthorMention(sageMessage, isSecretMention);
	if (gmMention) {
		return `${gmMention}, ${authorMention}`;
	}
	return authorMention;
}

//#endregion

//#region Channels

async function ensureTargetChannel(sageMessage: TInteraction): Promise<TChannel> {
	const channel = await sageMessage.discord.fetchChannel(sageMessage.channel?.sendDiceTo);
	if (channel) {
		return channel;
	}
	if (sageMessage instanceof SageInteraction) {
		return (sageMessage.interaction as Discord.ButtonInteraction).channel as TChannel;
	}
	return sageMessage.message.channel as TChannel;
}

async function ensureGmTargetChannel(sageMessage: TInteraction, hasSecret: boolean): Promise<TGmChannel> {
	if (!hasSecret || (sageMessage.diceSecretMethodType !== DiceSecretMethodType.GameMasterChannel && sageMessage.diceSecretMethodType !== DiceSecretMethodType.GameMasterDirect)) {
		return null;
	}
	if (sageMessage.diceSecretMethodType === DiceSecretMethodType.GameMasterChannel) {
		const channel = await sageMessage.game?.gmGuildChannel();
		if (channel) {
			return channel as TChannel;
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

type TArgs = { indexed:string[]; named:TKeyValueArg[] };
function parseMacroArgs(argString: string): TArgs {
	const parsers = {
		spaces: createWhitespaceRegex(),
		named: createKeyValueArgRegex(),
		quotes: createQuotedRegex(true)
	};
	const tokens = Tokenizer.tokenize(argString.trim(), parsers);
	const named = tokens
		.filter(token => token.type === "named")
		.map(token => parseKeyValueArg(token.token)!);
	const indexed = tokens
		.filter(token => !["spaces", "named"].includes(token.type))
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

function namedArgValueOrDefaultValue(arg: Optional<TKeyValueArg>, def: Optional<string>): string {
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

async function diceTest(sageMessage: SageMessage): Promise<void> {
	//#region validate command

	if (!sageMessage.allowDice) {
		await sageMessage.message.reply("*Dice not allowed in this channel!*");
		return;
	}
	if (sageMessage.game && !(sageMessage.isGameMaster || sageMessage.isPlayer)) {
		await sageMessage.message.reply("*Only members of this game allowed!*");
		return;
	}

	const pairs = sageMessage.args.keyValuePairs(),
		filtered = pairs.filter(pair => ["die", "sides", "type"].includes(pair.key.toLowerCase())),
		pair = filtered.shift() ?? { key:sageMessage.args[0], value:+dequote(sageMessage.args[1]) };
	if (!pair?.value) {
		await sageMessage.message.reply("*Die type not given!*");
		return;
	}

	const dieSize = +pair.value;
	if (![2,3,4,6,8,10,12,20].includes(dieSize)) {
		await sageMessage.message.reply("*Die type not valid! (2, 3, 4, 6, 8, 10, 12, 20)*");
		return;
	}

	//#endregion

	const iterations = 10000;

	//#region roll dice

	const rolls: number[] = [];
	let counter = iterations;
	do {
		rolls.push(random(dieSize));
	} while(--counter);

	//#endregion

	const results = mapDiceTestResults({ dieSize, iterations, rolls });

	//#region count streaks

	const singleValueStreaksRaw = [] as { result:number; streaks:number[]; }[];
	const highLowStreaksRaw = [] as { high:boolean; low:boolean; streak:number[]; }[];
	const lowCutoff = dieSize / 2;

	results.rolls.forEach((roll, index, rolls) => {
		//#region single value
		const singleValueStreaks = singleValueStreaksRaw[roll] ?? (singleValueStreaksRaw[roll] = { result:roll, streaks:[] });
		if (rolls[index - 1] === roll) {
			singleValueStreaks.streaks[singleValueStreaks.streaks.length - 1] += 1;
		}else {
			singleValueStreaks.streaks.push(1);
		}
		//#endregion
		//#region high low
		const high = roll > lowCutoff;
		const last = highLowStreaksRaw[highLowStreaksRaw.length - 1];
		const streak = last?.high === high ? last : { high, low:!high, streak:[] };
		if (last !== streak) {
			highLowStreaksRaw.push(streak);
		}
		streak.streak.push(roll);
		//#endregion
	});

	//#region single value
	const singleValueStreaks = singleValueStreaksRaw.reduce((out, roll) => {
			roll?.streaks.forEach(length => {
				if (length > 1) {
					addStreakLength(out[roll.result] ?? (out[roll.result] = { }), length);
				}
			});
			return out;
		}, { } as { [roll: number]: TStreakLengths });
	//#endregion

	//#region high low
	const highLowStreaks = highLowStreaksRaw.reduce((out, streak) => {
		if (streak.streak.length > 1) {
			addStreakLength(out[streak.high ? "high" : "low"], streak.streak.length);
		}
		return out;
	}, { high:{} as TStreakLengths, low:{} as TStreakLengths });
	//#endregion

	//#endregion

	//#region map counts

	const expectedAvg = Math.round(iterations / dieSize);
	const expectedAvgLen = addCommas(expectedAvg).length;
	const mappedCounts = results.counts.map((dieCount, dieRoll) => {
		const die = addCommas(dieRoll).padStart(2, " ");
		const count = addCommas(dieCount).padStart(expectedAvgLen, " ");
		const delta = dieCount - expectedAvg;
		const cDelta = addCommas(delta);
		const sDelta = delta < 0 ? cDelta : `+${cDelta}`;
		return { die, count, delta, cDelta, sDelta };
	}).slice(1);
	const highLowCounts = results.counts.reduce((out, dieCount, dieRoll) => {
		if (dieRoll) {
			out[dieRoll > lowCutoff ? "high" : "low"] += dieCount;
		}
		return out;
	}, { high:0, low:0 });

	//#endregion

	const maxDelta = mappedCounts.reduce((max, count) => Math.max(Math.abs(count.delta), max), 0);

	//#region create output

	let output = `**Test Results: d${dieSize} x${addCommas(iterations)}**\n\`\`\``;
	mappedCounts.forEach(count => {
		const sDeltaBar = createDeltaBar(maxDelta, count.delta);
		output += `\n${count.die}: ${count.count} ${sDeltaBar} (${count.sDelta})`;
	});
	(["high", "low"] as ("high" | "low")[]).forEach(hl => {
		output += `\n\n${hl}: ${addCommas(highLowCounts[hl])}`;
	});
	output += "```\n**Streaks**\n*Roll: Length (xCount)*```";
	for (let i = 1; i <= dieSize; i++) {
		output += `\n${i}: `;
		output += Object.keys(singleValueStreaks[i]).filter(key => key !== "max").map(key => `${key} (x${singleValueStreaks[i][key as any]})`).join(", ");
	}
	(["high", "low"] as ("high" | "low")[]).forEach(hl => {
		output += `\n\n${hl}: `;
		output += Object.keys(highLowStreaks[hl]).filter(key => key !== "max").map(key => `${key} (x${highLowStreaks[hl][key as any]})`).join(", ");
	});
	output += "```";

	//#endregion

	await sageMessage.send(output);
}

type TStreakLengths = { [length: number]:number; max?:number; };
function addStreakLength(lengths: TStreakLengths, length: number): void {
	const max = lengths.max;
	lengths[length] = (lengths[length] ?? 0) + 1;
	if (!max || length > max) {
		lengths.max = length;
	}
}

function createDeltaBar(biggestDelta: number, delta: number): string {
	if (delta !== 0) {
		const deltaPercent = (delta < 0 ? -1 : 1) * Math.round(100 * Math.abs(delta) / biggestDelta);
		if (deltaPercent < -80) return `-----0     `;
		if (deltaPercent < -60) return ` ----0     `;
		if (deltaPercent < -40) return `  ---0     `;
		if (deltaPercent < -20) return `   --0     `;
		if (deltaPercent < 0)   return `    -0     `;
		if (deltaPercent > 80)  return `     0+++++`;
		if (deltaPercent > 60)  return `     0++++ `;
		if (deltaPercent > 40)  return `     0+++  `;
		if (deltaPercent > 20)  return `     0++   `;
		if (deltaPercent > 0)   return `     0+    `;
	}
	return `     0     `;
}

type TDiceTestResults = {
	counts: number[];
	dieSize: number;
	iterations: number;
	minCount: number;
	maxCount: number;
	rolls: number[];
};

function mapDiceTestResults({ dieSize, iterations, rolls }: { dieSize: number; iterations: number; rolls: number[]; }): TDiceTestResults {
	const counts = rolls.reduce((out, value) => {
		out[value] = (out[value] ?? 0) + 1;
		return out;
	}, [] as number[]);
	const [minCount, maxCount] = counts.reduce((minMax, count) => {
		minMax[0] = Math.min(minMax[0] ?? 0, count);
		minMax[1] = Math.max(minMax[1] ?? 0, count);
		return minMax;
	}, [] as number[]);
	return {
		counts, dieSize, iterations, minCount, maxCount, rolls
	};
}

//#endregion

export default function register(): void {
	registerCommandRegex(/dice test (die|size)=("d?\d+"|\d+)/i, diceTest);
	registerMessageListener(hasUnifiedDiceCommand, sendDice as any, { priorityIndex:1 });

	registerInlineHelp("Dice", "Basic",
		`[1d20]`
		+ `\n[1d20 + 5] *(modifiers)*`
		+ `\n[1d20 prof + 5 str] *(descriptions)*`
		+ `\n`
		+ `\n__Tests__`
		+ `\n[1d20 >= 10] *(<, <=, >, >=, =)*`
		+ `\n[1d20 gteq 10] *(lt, lteq, gt, gteq, eq)*`
		+ `\n - *to avoid keyboard switching on mobile*`
		+ `\n`
		+ `\n__Types vs Sets__`
		+ `\n[1d8 + 1d4] *(added together)*`
		+ `\n[1d20 attack; 1d8 damage] *(rolled separately)*`
		+ `\n`
		+ `\n__Sets w/ Tests__`
		+ `\n[1d20 > 10 attack; 1d8 damage]`
		+ `\n - *only rolls second set if the first is successful*`
		+ `\n`
		+ `\n__Drop / Keep / NoSort__`
		+ `\n[3d6ns] *(no sort)*`
		+ `\n[4d6dl] *(drop lowest 1)*`
		+ `\n[5d6dl2] *(drop lowest X)*`
		+ `\n[6d6kh] *(keep highest 1)*`
		+ `\n[7d6kh3] *(keep highest X)*`
		+ `\n`
		+ `\n__Output Size Override__`
		+ `\n[xxs 1d20 + 5 attack; 1d8 + 1d6 + 1 damage]`
		+ `\n - *(xxs, xs, s, m, l, xl, xxl; default: m)*`
		+ `\n`
		+ `\n__Game Override__`
		+ `\n[pf2e 1d20 + 5 attack ac 10; 1d8 + 1d6 + 1 damage]`
		+ `\n - *(pf2e, quest; more to be added)*`
	);

	registerInlineHelp("Dice", "PF2e",
		`[1d20 ac 10] *(ac acts as >=)*`
		+ `\n[1d20 dc 10] *(dc acts as >=)*`
		+ `\n[1d20 vs 10] *(vs acts as >=)*`
	);

	registerInlineHelp("Dice", "Macro", "*see Macro help* `!help macro`");
}
