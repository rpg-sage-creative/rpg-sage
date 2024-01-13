import { debug } from "@rsc-utils/console-utils";
import * as Discord from "discord.js";
import { StringMatcher, dequote, escapeForRegExp } from "../../../../sage-utils/utils/StringUtils";
import { DiscordId } from "../../../discord";
import { COL, LayerType, ROW, TGameMapAura, TGameMapCore, TGameMapImage } from "./GameMapBase";
import RenderableGameMap from "./RenderableGameMap";

export type TParsedGameMapCore = Omit<TGameMapCore, "messageId">;
export type TValidatedGameMapCore = TParsedGameMapCore & {
	invalidImages: string[];
	invalidUsers: string[];
};

/** matches a line and cleans it up for use if found */
function matchLine(lines: string[], regex: RegExp, slice?: boolean): string | undefined;
function matchLine(lines: string[], regex: RegExp, slice?: boolean, split?: boolean): number[] | undefined;
function matchLine(lines: string[], regex: RegExp, slice = false, split = false): string | number[] | undefined {
	let line = lines.find(_line => regex.test(_line));
	if (line) {
		if (slice && line.includes("=")) {
			line = line.slice(line.indexOf("=") + 1);
		}
		line = dequote(line).trim();
		if (split) {
			const numbers = line.split(/[x,]/).map(s => +s.trim());
			const twoOrFour = numbers.length === 2 || numbers.length === 4;
			if (!twoOrFour || numbers.find(num => isNaN(num))) {
				return undefined;
			}
			return numbers;
		}
		return line;
	}
	return undefined;
}

/** returns a string array for a given section of a map */
function spliceSection(lines: string[], section: "map" | "terrain" | "token" | "aura"): string[] {
	const regex = /^\s*\[(map|terrain|aura|token)\]\s*$/i;
	const sectionIndex = lines.findIndex(line => line.match(regex)?.[1] === section);
	const nextSectionIndex = lines.findIndex((line, index) => index > sectionIndex && line.match(regex));
	if (sectionIndex < 0) {
		return [];
	}
	if (nextSectionIndex < 0) {
		return lines.splice(sectionIndex, lines.length - sectionIndex).map(s => s.trim()).filter(s => s);
	}
	return lines.splice(sectionIndex, nextSectionIndex - sectionIndex).map(s => s.trim()).filter(s => s);
}

/** returns all sections that match the given section value */
function spliceSections(lines: string[], section: "map" | "terrain" | "token" | "aura"): string[][] {
	const sections: string[][] = [];
	let loop = true;
	do {
		const spliced = spliceSection(lines, section);
		if (spliced.length) {
			sections.push(spliced);
		}else {
			loop = false;
		}
	}while(loop);
	return sections;
}

function matchUrlAndName(lines: string[]): [string?, string?] {
	const url = matchLine(lines, /^url=/i, true) ?? matchLine(lines, /^https?\:\/\//i);
	const name = matchLine(lines, /^name=/i, true);
	return [url, name];
}

async function parseUser(guild: Discord.Guild, userValue?: string): Promise<Discord.Snowflake | undefined> {
	// don't waste time
	if (!userValue) {
		return undefined;
	}

	// if we have a discord snowflake ... make sure it is valid
	if (DiscordId.isValidId(userValue)) {
		const user = await guild.client.users.fetch(userValue);
		return user?.id;
	}

	// break the user string down (ignore ZERO_WIDTH_SPACE in case if is a copy/paste from game/char/user details)
	const [_, username, discriminator] = userValue.match(/^@?\u200b?([^#]+)(?:#(\d{1,4}))?$/) ?? [];

	// look for proper tag match
	const tag = `${username}#${discriminator ?? "0"}`;
	const tagRegex = new RegExp(escapeForRegExp(tag), "i");
	const tagMatch = guild.members.cache.find(member => tagRegex.test(member.user.tag));
	if (tagMatch) {
		debug(`parseUser match: tag = "${tag}"`);
		return tagMatch.id;
	}

	// look for username, displayName, and nickname matches and only return a singleton
	const usernameRegex = new RegExp(escapeForRegExp(username), "i");
	const usernameMatches = Array.from(guild.members.cache.filter(member => {
		if (usernameRegex.test(member.user.username)) {
			debug(`parseUser match: username = "${member.user.username}"`);
			return true;
		}
		if (usernameRegex.test(member.displayName)) {
			debug(`parseUser match: displayName = "${member.displayName}"`);
			return true;
		}
		if (usernameRegex.test(member.nickname ?? "")) {
			debug(`parseUser match: nickname = "${member.nickname}"`);
			return true;
		}
		return false;
	}).values());
	if (usernameMatches.length === 1) {
		return usernameMatches[0].id;
	}

	debug(`parseUser no match: ${userValue}`);

	// we got nothing
	return undefined;
}

/** returns a GameMapCore that contains the imported settings */
function mapSectionToMapCore(lines: string[]): TParsedGameMapCore | null {
	const [url, name] = matchUrlAndName(lines);
	if (!url || !name) {
		debug(`mapSectionToMapCore: !url (${!url}) || !name (${!name})`);
		return null;
	}

	const [cols, rows] = matchLine(lines, /^grid=/i, true, true)
		?? [+matchLine(lines, /^cols=/i, true)!, +matchLine(lines, /^rows=/i, true)!];
	if (isNaN(cols) || isNaN(rows)) {
		debug(`mapSectionToMapCore: isNaN(cols) (${isNaN(cols)}) || isNaN(rows) (${isNaN(rows)})`);
		return null;
	}

	const gridColor = (matchLine(lines, /^gridColor=/i, true)?.match(/^#([a-f0-9]{3}){1,2}$/i) ?? [])[0];

	const spawn = matchLine(lines, /^spawn=/i, true, true);
	const clip = matchLine(lines, /^clip=/i, true, true);
	const userId = matchLine(lines, /^user=/i, true);

	return {
		activeMap: {},
		auras: [],
		clip: clip as [number, number, number, number],
		grid: [cols, rows, gridColor],
		id: Discord.SnowflakeUtil.generate(),
		name: name,
		spawn: spawn as [number, number],
		terrain: [],
		tokens: [],
		url: url,
		userId: userId!
	};
}

function mapSectionTo<T extends TGameMapImage>(lines: string[], layerType: LayerType): T | null {
	const [url, name] = matchUrlAndName(lines);
	if (!url || !name) {
		debug(`mapSectionTo(${LayerType[layerType]}): !url (${!url}) || !name (${!name})`);
		return null;
	}

	const pos = matchLine(lines, /^pos(ition)?=/i, true, true)
		?? [+matchLine(lines, /^col=/i, true)!, +matchLine(lines, /^row=/i, true)!];
	if (isNaN(pos[COL]) || isNaN(pos[ROW])) {
		debug(`mapSectionTo(${LayerType[layerType]}): isNaN(pos[COL]) (${isNaN(pos[COL])}) || isNaN(pos[ROW]) (${isNaN(pos[ROW])})`);
		return null;
	}

	const size = matchLine(lines, /^size=/i, true, true)
		?? [+matchLine(lines, /^cols=/i, true)!, +matchLine(lines, /^rows=/i, true)!];
	if (isNaN(size[COL]) || isNaN(size[ROW])) {
		size[COL] = size[ROW] = 1;
	}

	const scaleString = matchLine(lines, /^scale=/i, true);
	const scalePercent = (scaleString?.match(/(\d+)%/) ?? [])[1];
	const scaleDecimal = (scaleString?.match(/(\d+\.\d+|\.\d+|\d+)/) ?? [])[1];
	const scale = scalePercent ? (+scalePercent / 100) : scaleDecimal ? +scaleDecimal : undefined;

	const userId = matchLine(lines, /^user=/i, true);

	return {
		auras: [],
		id: Discord.SnowflakeUtil.generate(),
		layer: layerType,
		name,
		pos,
		scale,
		size,
		url,
		userId
	} as unknown as T;
}

function mapSectionToAura(lines: string[]): TGameMapAura | null {
	const aura = mapSectionTo<TGameMapAura>(lines, LayerType.Aura);
	if (aura) {
		aura.anchorId = matchLine(lines, /^anchor=/i, true);
		const opacity = matchLine(lines, /^opacity=/i, true)!;
		if (opacity) {
			if (opacity.match(/^\d+%$/)) {
				aura.opacity = (+opacity.slice(0, -1)) / 100;
			}else if (!isNaN(+opacity)) {
				aura.opacity = +opacity;
			}
		}
	}
	return aura;
}

function matchAnchor(mapCore: TParsedGameMapCore, aura: TGameMapAura | null): void {
	if (aura?.anchorId) {
		const matcher = new StringMatcher(aura.anchorId);

		const tokenAnchor = mapCore.tokens.find(token => matcher.matches(token.name));
		if (tokenAnchor) {
			tokenAnchor.auras.push(aura);
			tokenAnchor.auraId = aura.id;
			aura.pos[COL] += tokenAnchor.pos[COL];
			aura.pos[ROW] += tokenAnchor.pos[ROW];
			return;
		}

		const terrainAnchor = mapCore.terrain.find(terrain => matcher.matches(terrain.name));
		if (terrainAnchor) {
			terrainAnchor.auras.push(aura);
			terrainAnchor.auraId = aura.id;
			aura.pos[COL] += terrainAnchor.pos[COL];
			aura.pos[ROW] += terrainAnchor.pos[ROW];
			return;
		}
	}
}

export default function gameMapImporter(raw: string): TParsedGameMapCore | null {
	const lines = raw.split(/\r?\n\r?/);

	//#region map
	const mapSection = spliceSection(lines, "map");
	const parsedCore = mapSectionToMapCore(mapSection);
	if (!parsedCore) {
		debug(`gameMapImporter: !parsedCore`);
		return null;
	}
	//#endregion

	//#region terrain
	const terrainSections = spliceSections(lines, "terrain");
	for (const section of terrainSections) {
		const terrain = mapSectionTo(section, LayerType.Terrain);
		if (terrain) {
			parsedCore.terrain.push(terrain);
		}
	};
	//#endregion

	//#region tokens
	const tokenSections = spliceSections(lines, "token");
	for (const section of tokenSections) {
		const token = mapSectionTo(section, LayerType.Token);
		if (token) {
			parsedCore.tokens.push(token);
		}
	}
	//#endregion

	//#region auras
	const auraSections = spliceSections(lines, "aura");
	for (const section of auraSections) {
		const aura = mapSectionToAura(section);
		if (aura) {
			matchAnchor(parsedCore, aura);
			if (!aura.anchorId) {
				parsedCore.auras.push(aura);
			}
		}
	}
	//#endregion

	return parsedCore;
}


export async function validateMapCore(parsedCore: TParsedGameMapCore, guild: Discord.Guild): Promise<TValidatedGameMapCore> {
	const testRenderResponse = await RenderableGameMap.testRender(parsedCore);

	const invalidUserSet = new Set<string>();
	parsedCore.userId = await validateUserId(parsedCore.userId) as string;
	for (const terrain of parsedCore.terrain) {
		terrain.userId = await validateUserId(terrain.userId) as string;
	}
	for (const aura of parsedCore.auras) {
		aura.userId = await validateUserId(aura.userId) as string;
	}
	for (const token of parsedCore.tokens) {
		token.userId = await validateUserId(token.userId) as string;
	}

	const invalidImages = testRenderResponse.invalidImageUrls;
	const invalidUsers = [...invalidUserSet];

	return { ...parsedCore, invalidImages, invalidUsers };

	async function validateUserId(userValue?: string): Promise<string | undefined> {
		if (userValue) {
			const validId = await parseUser(guild, userValue);
			if (validId) return validId;
			invalidUserSet.add(userValue);
		}
		return undefined;
	}
}
