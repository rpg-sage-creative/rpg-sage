import { debug, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { dequote, getQuotedRegexSource, getWordCharacterRegexSource } from "@rsc-utils/string-utils";
import XRegExp from "xregexp";
import type { GameCharacterCore } from "../../../model/GameCharacter.js";
import type { Names } from "../../../model/SageCommandArgs.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { TKeyValuePair } from "../../../model/SageMessageArgs.js";
import { getUserDid } from "./getUserDid.js";

export type StatModPair = TKeyValuePair<string> & { modifier?:"+"|"-" };

type Results = {
	core?: GameCharacterCore;
	mods?: StatModPair[];
	names: Names;
	stats?: TKeyValuePair<string>[];
	userId?: Snowflake;
};

function createStatModKeyValuePairRegex(): RegExp {
	const keySource = getWordCharacterRegexSource({ allowDashes:true, allowPeriods:true, quantifier:"+" });
	const modSource = `[+-]`;
	const quotedSource = getQuotedRegexSource({ lengthQuantifier:"*" });
	return XRegExp(`(${keySource})(${modSource})=(${quotedSource}|\\S+)`, "");
}

function parseStatModKeyValuePair(arg: string): StatModPair | undefined {
	const regex = createStatModKeyValuePairRegex();
	const match = regex.exec(arg);
	if (match) {
		return {
			key: match[1],
			modifier: match[2] as "+",
			value: dequote(match[3])
		};
	}
	return undefined;
}

function urlToName(url: Optional<string>): string | undefined {
	return url?.split("/").pop()?.split(".").shift();
}

export function getCharacterArgs(sageMessage: SageMessage, isGm: boolean): Results {
	const { args } = sageMessage;

	const validCharArgs = [
		// basics
		"alias", "avatar", "color", "token",
		// user
		"newuser", "user",
		// names
		"charname", "char", "oldname", "name", "newname"
	];

	const hasValidCharArgs = validCharArgs.some(key => args.hasString(key));

	const mods = args.toArray().map(parseStatModKeyValuePair).filter(pair => pair) as StatModPair[];

	const names = args.getNames();
	if (isGm) {
		if (names.newName) {
			names.oldName = sageMessage.gmCharacter.name;
		}
		if (names.count === 0) {
			names.name = sageMessage.gmCharacter.name;
		}
	}

	const stats = args.keyValuePairs().filter(pair => !validCharArgs.includes(pair.key.toLowerCase()) && !/[+-]$/.test(pair.key));
	debug({mods,stats});

	const userId = args.getUserId("newUser") ?? args.getUserId("user") ?? getUserDid(sageMessage) ?? undefined;

	// if we don't have valid core keys, let's just return out now
	if (!hasValidCharArgs) {
		return { core:undefined, mods, names, stats, userId };
	}

	// get the options directly
	const core: GameCharacterCore = {
		alias: args.getString("alias")!,
		autoChannels: undefined,
		avatarUrl: args.getUrl("avatar")!,
		companions: undefined,
		embedColor: args.getHexColorString("color")!,
		id: undefined!,
		tokenUrl: args.getUrl("token")!,
		name: names.newName ?? names.name!,
		userDid: userId ?? undefined
	};

	if (!core.name) {
		core.name = urlToName(core.tokenUrl) ?? urlToName(core.avatarUrl)!;
	}

	return { core, mods, names, stats, userId };
}