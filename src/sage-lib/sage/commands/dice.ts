import { DiceOutputType, DicePostType, DiceSecretMethodType, type DiceCritMethodType, type GameSystemType } from "@rsc-sage/types";
import { error } from "@rsc-utils/console-utils";
import { rollDie } from "@rsc-utils/dice-utils";
import { type DMessageChannel, type DMessageTarget } from "@rsc-utils/discord-utils";
import { addCommas } from "@rsc-utils/number-utils";
import { createKeyValueArgRegex, createQuotedRegex, createWhitespaceRegex, dequote, isWrapped, parseKeyValueArg, redactCodeBlocks, tokenize, unwrap, wrap, type KeyValueArg } from '@rsc-utils/string-utils';
import type { Optional } from "@rsc-utils/type-utils";
import type { ButtonInteraction } from "discord.js";
import XRegExp from "xregexp";
import type { TDiceOutput } from "../../../sage-dice/common.js";
import { DiscordDice } from "../../../sage-dice/dice/discord/index.js";
import { registerMessageListener } from "../../discord/handlers.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { TCommandAndArgsAndData } from "../../discord/index.js";
import { CharacterManager } from "../model/CharacterManager.js";
import type { CharacterShell } from "../model/CharacterShell.js";
import { GameCharacter } from "../model/GameCharacter.js";
import type { NamedCollection } from "../model/NamedCollection.js";
import { SageCommand } from "../model/SageCommand.js";
import { SageInteraction } from "../model/SageInteraction.js";
import { SageMessage } from "../model/SageMessage.js";
import type { TMacro } from "../model/User.js";
import { doStatMath } from "./dice/doStatMath.js";
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
import type { EncounterManager } from "./trackers/encounter/EncounterManager.js";

type TInteraction = SageMessage | SageInteraction;

type TGmChannel = Optional<DMessageTarget>;

type TDiscordDiceParseOptions = {
	gameSystemType?: GameSystemType;
	diceOutputType?: DiceOutputType;
	diceCritMethodType?: DiceCritMethodType;
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

function getBasicBracketRegex(): RegExp {
	return /\[+[^\]]+\]+/ig;
}

type ReplaceStatsArgs = {
	statRegex: RegExp;
	typeRegex: RegExp;
	npcs: CharacterManager;
	pcs: CharacterManager;
	pc?: GameCharacter | null;
	encounters?: EncounterManager;
};
function replaceStats(diceString: string, args: ReplaceStatsArgs, stack: string[] = []): string {
	let replaced = diceString;
	while (args.statRegex.test(replaced)) {
		replaced = replaced.replace(new RegExp(args.statRegex, "gi"), match => {
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
		// ensure any math is handled
		return doStatMath(replaced);
	}
	// return updated value
	return replaced;
}

function getStatRegex() {
	return XRegExp(`
		# no tick
		(?<!\`)

		\\{
			# char name or quoted char name
			(
				[\\w ]+    # <-- should we drop this space?
				|          # <-- in other places we allow alias (no spaces) or "quoted name with spaces"
				"[\\w ]+"
			)

			# separator
			:{2}

			# stat key
			(
				[^:{}]+
			)

			# default value
			(?:
				:
				([^{}]+)
			)?
		\\}

		# no tick
		(?!\`)
	`, "xi");
}

function getCharTypeRegex() {
	return XRegExp(`
		^
		(pc|stat)?
		(companion|hireling|alt|familiar)?
		$
	`, "xi");
}

function parseDiscordDice(sageMessage: TInteraction, diceString: string, overrides?: TDiscordDiceParseOptions): DiscordDice | null {
	if (!diceString) {
		return null;
	}

	const statRegex = getStatRegex();
	if (statRegex.test(diceString)) {
		const { game, isGameMaster, isPlayer } = sageMessage;
		if (!game || isGameMaster || isPlayer) {
			const npcs = game?.nonPlayerCharacters ?? sageMessage.sageUser.nonPlayerCharacters;
			const pcs = game?.playerCharacters ?? sageMessage.sageUser.playerCharacters;
			const pc = isPlayer && game ? sageMessage.playerCharacter : null;
			const encounters = game?.encounters;
			const typeRegex = getCharTypeRegex();
			diceString = replaceStats(diceString, { statRegex, typeRegex, npcs, pcs, pc, encounters });
		}
	}

	return DiscordDice.parse({
		diceString: diceString,
		defaultGameType: overrides?.gameSystemType ?? sageMessage.gameSystemType,
		defaultDiceOutputType: overrides?.diceOutputType ?? sageMessage.diceOutputType,
		defaultCritMethodType: overrides?.diceCritMethodType ?? sageMessage.diceCritMethodType,
		defaultDiceSecretMethodType: overrides?.diceSecretMethodType ?? sageMessage.diceSecretMethodType
	});
}

async function parseDiscordMacro(sageCommand: SageCommand, macroString: string, macroStack: string[] = []): Promise<TDiceOutput[] | null> {
	if (!sageCommand.isSageMessage()) {
		return null;
	}

	const macroAndOutput = macroToDice(sageCommand.sageUser.macros, unwrap(macroString, "[]"));
	if (macroAndOutput) {
		const { macro, output } = macroAndOutput;
		if (macroStack.includes(macro.name) && !isRandomItem(macroString)) {
			error(`Macro Recursion`, { macroString, macroStack });
			return parseDiscordDice(sageCommand, `[1d1 Recursion!]`)?.roll().toStrings() ?? [];
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

async function parseMatch(sageMessage: TInteraction, match: string, overrides?: TDiscordDiceParseOptions): Promise<TDiceOutput[]> {
	const noBraces = unwrap(match, "[]");

	const table = await fetchTableFromUrl(match) ?? parseTable(match);
	if (table) {
		const tableResults = await rollTable(sageMessage, noBraces, table);
		const childDice = tableResults[0]?.children?.map(child => wrap(unwrap(child, "[]"), "[]").match(getBasicBracketRegex()) ?? []).flat() ?? [];
		// debug({tableResults,tableResultsDice})
		for (const diceToParse of childDice) {
			const childMatches = await parseMatch(sageMessage, diceToParse, overrides);
			tableResults.push(...childMatches.flat());
		}
		return tableResults;
	}

	const dice = parseDiscordDice(sageMessage, `[${noBraces}]`, overrides);
	if (dice) {
		// debug("dice", match);
		return dice.roll().toStrings(sageMessage.diceOutputType);
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

export async function parseDiceMatches(sageMessage: TInteraction, content: string): Promise<TDiceMatch[]> {
	const diceMatches: TDiceMatch[] = [];
	const withoutCodeBlocks = redactCodeBlocks(content);
	const regex = new RegExp(getBasicBracketRegex());
	let execArray: RegExpExecArray | null;
	while (execArray = regex.exec(withoutCodeBlocks)) {
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

async function hasUnifiedDiceCommand(sageMessage: SageMessage): Promise<TCommandAndArgsAndData<TDiceOutput[]> | null> {
	if (!sageMessage.allowDice) return null;
	if (sageMessage.slicedContent.match(/^!*\s*((add|set)[ -]?macro|macro[ -]?(add|set))/i)) {
		return null;
	}
	if (sageMessage.slicedContent.match(/^!*\s*((add|set)[ -]?alias|alias[ -]?(add|set))/i)) {
		return null;
	}
	if (sageMessage.game && !(sageMessage.isGameMaster || sageMessage.isPlayer)) {
		return null;
	}

	const matches = await parseDiceMatches(sageMessage, sageMessage.slicedContent);
	if (matches.length > 0) {
		const output = matches.map(m => m.output).flat();
		return { command: "unified-dice", data: output };
	}
	return null;
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

async function ensureTargetChannel(sageMessage: TInteraction): Promise<DMessageChannel> {
	const channel = await sageMessage.discord.fetchChannel(sageMessage.channel?.sendDiceTo);
	if (channel) {
		return channel;
	}
	if (sageMessage instanceof SageInteraction) {
		return (sageMessage.interaction as ButtonInteraction).channel as DMessageChannel;
	}
	return sageMessage.message.channel as DMessageChannel;
}

async function ensureGmTargetChannel(sageMessage: TInteraction, hasSecret: boolean): Promise<TGmChannel> {
	if (!hasSecret || (sageMessage.diceSecretMethodType !== DiceSecretMethodType.GameMasterChannel && sageMessage.diceSecretMethodType !== DiceSecretMethodType.GameMasterDirect)) {
		return null;
	}
	if (sageMessage.diceSecretMethodType === DiceSecretMethodType.GameMasterChannel) {
		const channel = await sageMessage.game?.gmGuildChannel();
		if (channel) {
			return channel as DMessageChannel;
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

	const dieValue = sageMessage.args.getString("die") ?? sageMessage.args.getString("sides") ?? sageMessage.args.getString("type");
	if (!dieValue) {
		await sageMessage.message.reply("*Die type not given!*");
		return;
	}

	const dieSize = +dieValue.replace(/\D/g, "");
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
		rolls.push(rollDie(dieSize));
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

export function registerDice(): void {
	registerListeners({ commands:["dice|test"], message:diceTest });
	registerMessageListener(hasUnifiedDiceCommand, sendDice as any, { priorityIndex:1 });
}
