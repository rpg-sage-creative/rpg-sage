import * as Discord from "discord.js";
import { exists } from "../../../../sage-utils/utils/ArrayUtils/Filters";
import DiscordId from "../../../../sage-utils/utils/DiscordUtils/DiscordId";
import { dequote, StringMatcher } from "../../../../sage-utils/utils/StringUtils";
import { COL, LayerType, ROW, TGameMapAura, TGameMapCore, TGameMapImage } from "./GameMapBase";

export type TParsedGameMapCore = Omit<TGameMapCore, "messageId">;

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
	const url = matchLine(lines, /^https?\:\/\//i);
	const name = matchLine(lines, /^name=/i, true);
	return [url, name];
}

function parseUser(client: Discord.Client, userValue?: string): Discord.Snowflake | undefined {
	if (!userValue) {
		return undefined;
	}
	if (DiscordId.isValidId(userValue)) {
		return userValue;
	}
	const user = client.users.cache.find(_user => {
		const name = `${_user.username}#${_user.discriminator}`;
		return userValue === name || userValue === `@${name}`;
	});
	return user?.id;
}

/** returns a GameMapCore that contains the imported settings */
function mapSectionToMapCore(lines: string[]): TParsedGameMapCore | null {
	const [url, name] = matchUrlAndName(lines);
	if (!url || !name) {
		return null;
	}

	const grid = matchLine(lines, /^grid=/i, true, true)
		?? [+matchLine(lines, /^cols=/i, true)!, +matchLine(lines, /^rows=/i, true)!];
	if (isNaN(grid[COL]) || isNaN(grid[ROW])) {
		return null;
	}

	const spawn = matchLine(lines, /^spawn=/i, true, true);
	const clip = matchLine(lines, /^clip=/i, true, true);
	const userId = matchLine(lines, /^user=/i, true);

	return {
		activeMap: {},
		auras: [],
		clip: clip as [number, number, number, number],
		grid: grid as [number, number],
		id: Discord.SnowflakeUtil.generate().toString(),
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
		return null;
	}

	const pos = matchLine(lines, /^pos(ition)?=/i, true, true)
		?? [+matchLine(lines, /^col=/i, true)!, +matchLine(lines, /^row=/i, true)!];
	if (isNaN(pos[COL]) || isNaN(pos[ROW])) {
		return null;
	}

	const size = matchLine(lines, /^size=/i, true, true)
		?? [+matchLine(lines, /^cols=/i, true)!, +matchLine(lines, /^rows=/i, true)!];
	if (isNaN(size[COL]) || isNaN(size[ROW])) {
		size[COL] = size[ROW] = 1;
	}

	const userId = matchLine(lines, /^user=/i, true);

	return {
		auras: [],
		id: Discord.SnowflakeUtil.generate(),
		layer: layerType,
		name: name,
		pos: pos as [number, number],
		size: size as [number, number],
		url: url,
		userId: userId
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

export default function gameMapImporter(raw: string, client: Discord.Client): TParsedGameMapCore | null {
	const lines = raw.split(/\r?\n\r?/);

	//#region map
	const mapSection = spliceSection(lines, "map");
	const parsedCore = mapSectionToMapCore(mapSection);
	if (!parsedCore) {
		return null;
	}
	parsedCore.userId = parseUser(client, parsedCore.userId)!;
	//#endregion

	//#region terrain
	const terrainSections = spliceSections(lines, "terrain");
	const terrain = terrainSections.map(section => {
		const _terrain = mapSectionTo(section, LayerType.Terrain);
		if (_terrain) {
			_terrain.userId = parseUser(client, _terrain.userId);
		}
		return _terrain;
	}).filter(exists);
	parsedCore.terrain.push(...terrain);
	//#endregion

	//#region tokens
	const tokenSections = spliceSections(lines, "token");
	const tokens = tokenSections.map(section => {
		const _token = mapSectionTo(section, LayerType.Token);
		if (_token) {
			_token.userId = parseUser(client, _token.userId);
		}
		return _token;
	}).filter(exists);
	parsedCore.tokens.push(...tokens);
	//#endregion

	//#region auras
	const auraSections = spliceSections(lines, "aura");
	const auras = auraSections.map(section => {
		const _aura = mapSectionToAura(section);
		if (_aura) {
			_aura.userId = parseUser(client, _aura.userId);
			matchAnchor(parsedCore, _aura);
		}
		return _aura;
	}).filter(exists);
	parsedCore.auras.push(...auras.filter(aura => !aura.anchorId));
	//#endregion

	return parsedCore;
}
