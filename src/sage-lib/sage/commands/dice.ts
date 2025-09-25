import { DiceOutputType, DicePostType, DiceSecretMethodType, type DiceCritMethodType, type GameSystemType } from "@rsc-sage/types";
import type { Optional } from "@rsc-utils/core-utils";
import { error } from "@rsc-utils/core-utils";
import { doStatMath } from "@rsc-utils/dice-utils";
import { xRegExp } from "@rsc-utils/dice-utils/build/internal/xRegExp.js";
import type { MessageChannel, MessageTarget } from "@rsc-utils/discord-utils";
import { createKeyValueArgRegex, isWrapped, redactCodeBlocks, tokenize, unwrap, wrap } from '@rsc-utils/string-utils';
import type { TDiceOutput } from "../../../sage-dice/common.js";
import { DiscordDice } from "../../../sage-dice/dice/discord/index.js";
import { registerMessageListener } from "../../discord/handlers.js";
import type { TCommandAndArgsAndData } from "../../discord/index.js";
import type { DiceMacroBase, MacroBase } from "../model/Macro.js";
import type { SageCommand } from "../model/SageCommand.js";
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
import { StatMacroProcessor } from "./dice/stats/StatMacroProcessor.js";

type TGmChannel = Optional<MessageTarget>;

type BaseParseOptions = {
	processor: StatMacroProcessor;
	sageCommand: SageCommand;
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

type DiscordDiceOverrides = {
	gameSystemType?: GameSystemType;
	diceOutputType?: DiceOutputType;
	diceCritMethodType?: DiceCritMethodType;
	diceSecretMethodType?: DiceSecretMethodType;
};
type ParseDiscordDiceOptions = BaseParseOptions & {
	overrides?: DiscordDiceOverrides;
};
async function parseDiscordDice(diceString: string, options: ParseDiscordDiceOptions): Promise<DiscordDice | null> {
	if (!diceString) {
		return null;
	}

	const { overrides, processor, sageCommand } = options;

	if (!processor.isEmpty) {
		diceString = processor.processStatBlocks(diceString);
	}

	// final math pass
	diceString = doStatMath(diceString);

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

type ParseDiscordMacroOptions = BaseParseOptions & {
	macroStack?: string[];
};
async function parseDiscordMacro(macroString: string, options: ParseDiscordMacroOptions): Promise<TDiceOutput[] | null> {
	const { macroStack = [], processor, sageCommand } = options;

	// get tiered macros
	const tieredMacros = getTieredMacros(sageCommand);

	// if we have more macros, unshift them to give them first priority
	if (processor.hasMacros) {
		tieredMacros.unshift(processor.macros);
	}

	// find the macro
	const macroAndOutput = macroToDice(tieredMacros, unwrap(macroString, "[]"));
	if (macroAndOutput) {
		const { macro, output } = macroAndOutput;
		if (macroStack.includes(macro.name) && !isRandomItem(macroString)) {
			error(`Macro Recursion`, { macroString, macroStack });
			const parsedDice = await parseDiscordDice(`[0d0 Recursion!]`, { processor, sageCommand });
			return parsedDice?.roll().toStrings() ?? [];
		}

		const diceToParse = output.match(getBasicBracketRegex()) ?? [];

		const outputs: TDiceOutput[] = [];
		for (const dice of diceToParse) {
			if (!isRandomItem(dice)) {
				const diceMacroOutputs = await parseDiscordMacro(dice, { sageCommand, processor, macroStack:macroStack.concat([macro.name]) });
				if (diceMacroOutputs?.length) {
					outputs.push(...diceMacroOutputs);
					continue;
				}
			}
			const matchOutputs = await parseMatch(dice, { sageCommand, processor, overrides:{ diceOutputType: DiceOutputType.XXL } });
			if (matchOutputs?.length) {
				outputs.push(...matchOutputs);
			}
		}
		return outputs;
	}
	return null;
}

type ParseMatchOptions = BaseParseOptions & {
	overrides?: DiscordDiceOverrides;
	tableIterations?: number;
};
async function parseMatch(match: string, options: ParseMatchOptions): Promise<TDiceOutput[]> {
	const { processor, sageCommand, tableIterations = 0 } = options;
	const noBraces = unwrap(match, "[]");

	const table = await fetchTableFromUrl(match) ?? parseTable(match);
	if (table) {
		const tableResults = await rollTable(sageCommand, noBraces, table);
		const childDice = tableResults[0]?.children?.map(child => wrap(unwrap(child, "[]"), "[]").match(getBasicBracketRegex()) ?? []).flat() ?? [];
		// debug({tableResults,tableResultsDice})
		for (const diceToParse of childDice) {
			const childMatches = await parseMatch(diceToParse, { processor, sageCommand, tableIterations:tableIterations + 1 });
			tableResults.push(...childMatches.flat());
		}
		return tableResults;
	}

	const dice = await parseDiscordDice(`[${noBraces}]`, { processor, sageCommand });
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

type ParseDiceMatchesOptions = {
	processor?: StatMacroProcessor;
	sageCommand: SageCommand;
};
export async function parseDiceMatches(content: string, { processor, sageCommand }: ParseDiceMatchesOptions): Promise<TDiceMatch[]> {
	/** @todo there was a check in parseDiscordMacro; we should never get here from a reaction ... do we need to find out why this check exists? */
	if (sageCommand.isSageReaction()) return [];

	const diceMatches: TDiceMatch[] = [];

	let parseOptions: BaseParseOptions;

	const redacted = redactContent(content);

	const regex = getBasicBracketRegex();
	let execArray: RegExpExecArray | null;
	while (execArray = regex.exec(redacted)) {
		// we only need to ensure the processor and options *IF* we have something to parse
		processor ??= StatMacroProcessor.withMacros(sageCommand);
		parseOptions ??= { processor, sageCommand };

		const match = execArray[0];
		const index = execArray.index;
		const inline = isWrapped(match, "[[]]");
		const output = await parseDiscordMacro(content.slice(index, index + match.length), parseOptions)
			?? await parseMatch(content.slice(index, index + match.length), parseOptions);
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
	if (sageCommand.game && !(sageCommand.canAdminGame || sageCommand.isPlayer)) {
		return undefined;
	}

	const matches = await parseDiceMatches(sageCommand.slicedContent, { sageCommand });
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

async function ensureTargetChannel(sageCommand: SageCommand): Promise<MessageChannel> {
	const channel = await sageCommand.sageCache.fetchChannel(sageCommand.channel?.sendDiceTo);
	if (channel) {
		return channel as MessageChannel;
	}
	if (sageCommand.isSageInteraction("MESSAGE") || sageCommand.isSageInteraction("MODAL")) {
		return sageCommand.interaction.channel as MessageChannel;
	}
	const message = await sageCommand.fetchMessage();
	return message!.channel as MessageChannel;
}

async function ensureGmTargetChannel(sageCommand: SageCommand, hasSecret: boolean): Promise<TGmChannel> {
	if (!hasSecret || (sageCommand.diceSecretMethodType !== DiceSecretMethodType.GameMasterChannel && sageCommand.diceSecretMethodType !== DiceSecretMethodType.GameMasterDirect)) {
		return null;
	}
	if (sageCommand.diceSecretMethodType === DiceSecretMethodType.GameMasterChannel) {
		const channel = await sageCommand.game?.gmGuildChannel();
		if (channel) {
			return channel as MessageChannel;
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
