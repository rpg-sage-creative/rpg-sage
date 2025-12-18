import { Arg, Color, debug, error, isBlank, warn, type Args, type HexColorString, type IncrementArg, type KeyValueArg, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { GameUserType } from "../../../model/Game.js";
import type { GameCharacterCore } from "../../../model/GameCharacter.js";
import type { Names } from "../../../model/SageCommandArgs.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { fetchAndParseAllDsv } from "../../../model/utils/dsv.js";
import { getUserDid } from "./getUserDid.js";

type Results = {
	core?: GameCharacterCore;
	mods?: IncrementArg[];
	names: Names;
	stats?: KeyValueArg[];
	userId?: Snowflake;
	type?: "pc" | "npc" | "companion" | "minion";
};

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

function isValidCoreKey(key: string): boolean {
	const validCoreKeys = [
		// basics
		"alias", "avatar", "color", "token",
		// user
		"newuser", "user",
		// names
		"charname", "oldname", "name", "newname"
	];
	return validCoreKeys.includes(key.toLowerCase());
}

function hexOrUndefined(value: Optional<string>): HexColorString | undefined {
	if (value) {
		try {
			const color = Color.from(value);
			if (color) return color.hex;
			warn("Unable to parse color:", value, color);
		}catch(ex) {
			error("Error parsing color:", value, ex);
		}
	}
	return undefined;
}

export function getCharacterArgs(sageMessage: SageMessage, isGm: boolean, isUpdate: boolean): Results {
	const { args } = sageMessage;

	/** @todo move the names logic into the getCore() function */
	const names = args.getNames();
	if (isGm && names.newName) {
		if (!names.oldName) names.count = (names.count ?? 1) + 1;
		names.oldName = sageMessage.gmCharacter?.name;
		names.isRename = true;
	}

	const core = getCore(sageMessage, names, isUpdate);

	/** @todo determine how this userId is being used to decide if we need to return it at all */
	const userId = args.getUserId("newUser") ?? args.getUserId("user") ?? getUserDid(sageMessage) ?? undefined;

	// set the userId when creating a new character
	if (core && !isUpdate) {
		core.userDid = userId;
	}

	// only do mods on an update
	const mods = isUpdate ? args.manager.incrementArgs() as IncrementArg[] : [];

	const stats = args.manager.keyValueArgs().filter(pair => !isValidCoreKey(pair.key));

	return { core, mods, names, stats, userId };
}

const TypeRegExp = /^type$/i;
const UserRegExp = /^user$/i;
const UnsetRegExp = /^unset$/i;

export async function getCharactersArgs(sageMessage: SageMessage, isGm: boolean, isUpdate: boolean): Promise<Results[]> {
	const dsvResults = await fetchAndParseAllDsv(sageMessage);

	if (!dsvResults.length) return [getCharacterArgs(sageMessage, isGm, isUpdate)];

	const results: Results[] = [];

	const dsvItems = dsvResults.map(res => res.items).flat(1);

	if (dsvItems.length) {
		const playerMap = new Map<string, Snowflake>();
		if (sageMessage.game) {
			for (const user of sageMessage.game?.users) {
				if (user.type === GameUserType.Player) {
					const dUser = await sageMessage.discord.fetchUser(user.did);
					if (dUser) playerMap.set(dUser.username.toLowerCase().replace(/^@/, ""), user.did);
				}
			}
		}
		dsvItems.forEach(item => {
			let core: GameCharacterCore | undefined;
			const getCore = () => (core ?? (core = {} as GameCharacterCore));
			let names: Names | undefined;
			const getNames = () => (names ?? (names = {} as Names));
			let stats: KeyValueArg[] | undefined;
			let type: "pc" | "npc" | "companion" | "minion" | undefined;
			let userId: Snowflake | undefined;

			Object.entries(item).forEach(([key, value], index) => {
				const valueOrNull = isBlank(value) || UnsetRegExp.test(value) ? null : value;
				if (TypeRegExp.test(key)) {
					type = /^(gm|pc|npc|companion|minion)$/i.test(value) ? value.toLowerCase() as "pc" : undefined;
				}else if (UserRegExp.test(key)) {
					if (valueOrNull) {
						userId = sageMessage.game?.hasPlayer(value) ? value as Snowflake : playerMap.get(value.toLowerCase().replace(/^@/, ""));
					}
				}else if (isValidCoreKey(key)) {
					switch(key.toLowerCase()) {
						// core
						case "alias": getCore().alias = valueOrNull!; break;
						case "avatar": getCore().avatarUrl = valueOrNull!; break;
						case "color": getCore().embedColor = hexOrUndefined(valueOrNull) ?? null!; break;
						case "token": getCore().tokenUrl = valueOrNull!; break;
						// names
						case "charname": getNames().charName = value; break;
						case "name": getCore().name = value; getNames().name = value; break;
						case "newname": getNames().newName = value; break;
						case "oldname": getNames().oldName = value; break;

						default: debug({key,value}); break;
					}
				}else {
					(stats ??= []).push(Arg.from({ raw:`${key}="${value}"`, index, isKeyValue:true, key, value:valueOrNull }));
				}
			});

			if (names) {
				names.count = Object.values(names).length;
			}else {
				names = { count:0 };
			}

			results.push({ core, names, stats, userId, type });
		});
	}

	return results;
}
