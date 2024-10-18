import { type Args, type Optional, type Snowflake } from "@rsc-utils/core-utils";
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
	const modSource = `\\+=|\\-=`;
	const incrementerSource = `\\+{2}|\\-{2}`;
	const quotedSource = getQuotedRegexSource({ lengthQuantifier:"*" });
	return XRegExp(`(${keySource})(?:(${incrementerSource})|(${modSource})(${quotedSource}|\\S+))`, "");
}

function parseStatModKeyValuePair(arg: string): StatModPair | undefined {
	const regex = createStatModKeyValuePairRegex();
	const match = regex.exec(arg);
	if (match) {
		const [_, key, incrementer, modifier, value] = match;
		if (incrementer) {
			return { key, modifier: incrementer[0] as "+", value: "1" };
		}
		return { key, modifier: modifier[0] as "+", value: dequote(value) };
	}
	return undefined;
}

function getCore({ args, message }: SageMessage, names: Names, isUpdate: boolean): GameCharacterCore | undefined {
	const useAliasAsName = isUpdate && !names.isRename && !names.name;

	let hasKeys = false;
	const core: Args<GameCharacterCore> = { };

	const alias = args.getString("alias");
	if (!useAliasAsName && alias !== undefined) {
		core.alias = alias;
		hasKeys = true;
	}

	const avatarUrl = args.getUrl("avatar");
	if (avatarUrl !== undefined) {
		core.avatarUrl = avatarUrl;
		hasKeys = true;
	}

	const embedColor = args.getHexColorString("color");
	if (embedColor !== undefined) {
		core.embedColor = embedColor;
		hasKeys = true;
	}

	const tokenUrl = args.getUrl("token");
	if (tokenUrl !== undefined) {
		core.tokenUrl = tokenUrl;
		hasKeys = true;
	}

	const newUserId = args.getUserId("newUser"); // used during update
	const userId = args.getUserId("user");       // used during create
	if (newUserId !== undefined || userId !== undefined) {
		// we must use ?: and not ?? to allow unsetting a userId via newUser="unset"/null
		core.userDid = newUserId !== undefined ? newUserId : userId;
		hasKeys = true;
	}

	// do name last to allow for using token/avatar
	if (isUpdate) {
		// when updating, check to see if we are renaming
		if (names.isRename) {
			core.name = names.newName;
			hasKeys = true;
		}

	}else {
		// when creating, use the "name" arg before trying to parse a name from a token or avatar
		core.name = names.name;
		if (!core.name) {
			const urlToName = (url: Optional<string>) => url?.split("/").pop()?.split(".").shift();
			core.name = urlToName(core.tokenUrl) ?? urlToName(core.avatarUrl);
		}
		if (core.name) {
			hasKeys = true;
		}
	}

	// let's see if they dropped an image to be set on the character
	if (tokenUrl === undefined || avatarUrl === undefined) {
		const images = message.attachments.filter(att => att.contentType?.startsWith("image/"));
		const tokenImage = images.find(att => /token/.test(att.name)) ?? images.find(att => !/avatar/.test(att.name)) ?? images.first();
		const avatarImage = images.find(att => /avatar/.test(att.name)) ?? images.find(att => !/token/.test(att.name) && att !== tokenImage) ?? images.find(att => att !== tokenImage);
		if (tokenUrl === undefined && tokenImage) {
			core.tokenUrl = tokenImage.url;
			hasKeys = true;
		}
		if (avatarUrl === undefined && avatarImage) {
			core.avatarUrl = avatarImage.url;
			hasKeys = true;
		}
	}

	return hasKeys ? core as GameCharacterCore : undefined;
}

export function getCharacterArgs(sageMessage: SageMessage, isGm: boolean, isUpdate: boolean): Results {
	const { args } = sageMessage;

	const validCoreKeys = [
		// basics
		"alias", "avatar", "color", "token",
		// user
		"newuser", "user",
		// names
		"charname", "char", "oldname", "name", "newname"
	];

	/** @todo move the names logic into the getCore() function */
	const names = args.getNames();
	if (isGm && names.newName) {
		names.oldName = sageMessage.gmCharacter.name;
	}
	const core = getCore(sageMessage, names, isUpdate);

	// only do mods on an update
	const mods = isUpdate ? args.toArray().map(parseStatModKeyValuePair).filter(pair => pair) as StatModPair[] : [];

	const stats = args.keyValuePairs().filter(pair => !validCoreKeys.includes(pair.key.toLowerCase()) && !/[+-]$/.test(pair.key));

	/** @todo determine how this userId is being used to decide if we need to return it at all */
	const userId = args.getUserId("newUser") ?? args.getUserId("user") ?? getUserDid(sageMessage) ?? undefined;

	// set the userId when creating a new character
	if (core && !isUpdate) {
		core.userDid = userId;
	}

	return { core, mods, names, stats, userId };
}