import { DEFAULT_GM_CHARACTER_NAME, parseGameSystem, type DialogPostType, type GameSystem } from "@rsc-sage/types";
import { Currency, CurrencyPf2e, type DenominationsCore } from "@rsc-utils/character-utils";
import { applyChanges, capitalize, Color, errorReturnUndefined, getDataRoot, isDefined, isNotBlank, isString, numberOrUndefined, sortByKey, StringMatcher, stringOrUndefined, StringSet, type Args, type HexColorString, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { doStatMath, processMath } from "@rsc-utils/dice-utils";
import { DiscordKey, toMessageUrl, urlOrUndefined } from "@rsc-utils/discord-utils";
import { fileExistsSync, getText, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { isWrapped, wrap } from "@rsc-utils/string-utils";
import { mkdirSync } from "fs";
import { checkStatBounds } from "../../../gameSystems/checkStatBounds.js";
import type { TPathbuilderCharacterMoney } from "../../../gameSystems/p20/import/pathbuilder-2e/types.js";
import { Condition } from "../../../gameSystems/p20/lib/Condition.js";
import { processCharacterTemplate } from "../../../gameSystems/processCharacterTemplate.js";
import { processSimpleSheet } from "../../../gameSystems/processSimpleSheet.js";
import { getExplorationModes, getSkills } from "../../../sage-pf2e/index.js";
import { PathbuilderCharacter, type TPathbuilderCharacter } from "../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { Deck, type DeckCore, type DeckType } from "../../../sage-utils/utils/GameUtils/deck/index.js";
import type { StatModPair } from "../commands/admin/GameCharacter/getCharacterArgs.js";
import { loadCharacterCore, loadCharacterSync, type TEssence20Character, type TEssence20CharacterCore } from "../commands/e20.js";
import { DialogMessageData, type DialogMessageDataCore } from "../repo/DialogMessageRepository.js";
import { CharacterManager } from "./CharacterManager.js";
import type { MacroBase } from "./Macro.js";
import { NoteManager, type TNote } from "./NoteManager.js";
import type { TKeyValuePair } from "./SageMessageArgs.js";
import { hpToGauge } from "./utils/hpToGauge.js";

/*
Character will get stored in /users/USER_ID/characters/CHARACTER_ID.
Character will save snapshots .snapshots[... { ts, core }]
Character snapshots will be created when imported to Game or added to Encounter.
Character snapshots will be created on request for Patrons.

Importing a character to a Game will create a GameCharacter.
GameCharacter will get stored in /games/GAME_ID/characters/CHARACTER_ID.
GameCharacter will store a reference to original Character as .original = { id, ts, type:"Character" }
GameCharacter will save snapshots as .snapshots[... { ts, core }]
GameCharacter snapshots will be created when added to Encounter.
GameCharacter snapshots will be created on request for Patrons.

Adding a character to an Encounter will create an EncounterCharacter.
? EncounterCharacter will get stored in /encounters/ENCOUNTER_ID/characters/CHARACTER_ID.
EncounterCharacter will store a reference to original Character as .original = { id, ts, type:"Character"|"GameCharacter" }
EncounterCharacter will save snapshots as .snapshots[... { ts, core }]
EncounterCharacter snapshots will be created at the start of every round.
*/

export type TGameCharacterType = "gm" | "npc" | "pc" | "companion" | "minion";

export type AutoChannelData = {
	channelDid: Snowflake;
	dialogPostType?: DialogPostType;
	userDid?: Snowflake;
};

export type GameCharacterCore = {
	/** nickname (aka) */
	aka?: string;
	/** short name used to ease dialog access */
	alias?: string;
	/** Channels to automatically treat input as dialog */
	autoChannels?: AutoChannelData[];
	/** The image used for the right side of the dialog */
	avatarUrl?: string;
	/** The character's companion characters */
	companions?: (GameCharacter | GameCharacterCore)[];
	/** experimental deck logic */
	decks?: (Deck | DeckCore)[];
	/** Discord compatible color: #001122 */
	embedColor?: HexColorString;
	/** Unique ID of this character */
	id: Snowflake;
	/** A list of the character's last messages by channel. */
	lastMessages?: (DialogMessageData | DialogMessageDataCore)[];
	/** Character tier macros */
	macros?: MacroBase[];
	/** The character's name */
	name: string;
	/** The character's notes (stats & journal too) */
	notes?: TNote[];
	/** The character's Pathbuilder build. */
	pathbuilder?: TPathbuilderCharacter;
	pathbuilderId?: string;
	essence20?: TEssence20CharacterCore;
	essence20Id?: string;
	/** The image used to represent the character to the left of the post */
	tokenUrl?: string;
	/** The character's user's Discord ID */
	userDid?: Snowflake;
};

// 		export type TPlayerCharacterImageType = "Default"
// 												| "Token" | "TokenBloody" | "TokenDying"
// 												| "Profile" | "ProfileBloody" | "ProfileDying"
// 												| "Full" | "FullBloody" | "FullDying";

function parseFetchedStats(raw: string, alias?: string) {
	const stats = new Map<Lowercase<string>, { key:string; keyLower:Lowercase<string>; value:string; }>();
	const macros: MacroBase[] = [];
	const lines = raw.split(/[\n\r]+/).map(line => line.split(/\t/).map(val => val.trim()));
	lines.forEach(line => {
		const results = parseFetchedStatsLine(line, alias);
		if (results) {
			if ("dialog" in results || "dice" in results) macros.push(results); // || "items" in results || "math" in results || "table" in results || "tableUrl" in results
			if ("value" in results) stats.set(results.keyLower, results);
		}
	});
	return { stats, macros };
}
function parseFetchedStatsLine(values: string[], alias?: string) {
	const setAlias = (value?: string) => value && alias ? value.replace(/\{::/g, `{${alias}::`) : value;
	const shift = () => setAlias(values.shift()?.trim());

	const key = shift();
	if (!key) return undefined;

	const value = shift();
	if (!value) return undefined;

	const keyLower = key.toLowerCase();
	if (keyLower === "macro") {
		const three = shift(), four = shift();
		if (four && isWrapped(four, "[]")) {
			return { name:value, category:three, dice:four } as MacroBase;
		}
		if (three && isWrapped(three, "[]")) {
			return { name:value, dice:three } as MacroBase;
		}

	}
	return { key, keyLower, value };
}

/** Temp convenience function to get a DiscordKey from varying input */
export function toDiscordKey(channelDidOrDiscordKey: DiscordKey | Snowflake, threadDid?: Snowflake): DiscordKey {
	if (channelDidOrDiscordKey instanceof DiscordKey) {
		return channelDidOrDiscordKey;
	}
	return new DiscordKey(null, channelDidOrDiscordKey, threadDid);
}

//#region temp files

type TempIds = {
	charId: string;
	gameId?: string;
	userId: string;
};

function createTempPath({ charId, gameId, userId }: TempIds): string {
	const sageRoot = getDataRoot("sage");
	const path = gameId
		? `${sageRoot}/games/${gameId}/characters`
		: `${sageRoot}/users/${userId}/characters`;
	if (!fileExistsSync(path)) {
		mkdirSync(path, { recursive:true });
	}
	return `${path}/${charId}.json.tmp`;
}

//#endregion

//#region Core Updates

interface IOldGameCharacterCore extends Omit<GameCharacterCore, "autoChannels" | "embedColor"> {
	autoChannels?: (Snowflake | AutoChannelData)[];
	embedColor?: string;
	iconUrl?: string;
}

function updateCore(core: IOldGameCharacterCore): GameCharacterCore {
	//#region update autoChannels
	if (core.autoChannels) {
		core.autoChannels = core.autoChannels.map(data => {
			if (typeof(data) === "string") {
				return { channelDid:data, userDid:core.userDid };
			}
			return data;
		});
	}
	//#endregion

	//#region update embedColor
	if (core.embedColor) {
		core.embedColor = Color.from(core.embedColor)?.hex;
	}
	//#endregion

	//#region move .iconUrl to .avatarUrl
	if (core.iconUrl) {
		core.avatarUrl = core.iconUrl;
	}
	delete core.iconUrl;
	//#endregion

	/** @todo remove this when the cores have all been fixed! */
	fixLastMessages(core as GameCharacterCore);

	return core as GameCharacterCore;
}

/** @deprecated An initial attempt at the global in memory cache caused character lastMessages cores to become crazily nested! */
function fixLastMessages(core: GameCharacterCore): void {
	core.lastMessages = core.lastMessages?.map((lm: DialogMessageDataCore | { core:DialogMessageDataCore }) => {
		while("core" in lm) {
			lm = lm.core;
		}
		return lm;
	});
}

//#endregion

export type StatResults<
			Value extends string | number = string | number,
			Nil extends null | undefined = null
		> =
{
	isDefined: true;
	key: string;
	keyLower: Lowercase<string>;
	value: Value;
}
|
{
	isDefined: false;
	key: string;
	keyLower: Lowercase<string>;
	value: Nil;
};

export class GameCharacter {
	public equals(other: string | GameCharacter | undefined): boolean {
		if (!other) return false;
		if (other instanceof GameCharacter) return other.id === this.core.id;
		return this.core.id === other;
	}

	public constructor(private core: GameCharacterCore, protected owner?: CharacterManager) {
		updateCore(core);

		const companionType = this.isPcOrCompanion ? "companion" : "minion";
		this.core.companions = CharacterManager.from(this.core.companions as GameCharacterCore[] ?? [], this, companionType);
		this.core.lastMessages = this.core.lastMessages?.map(DialogMessageData.fromCore) ?? [];

		this.notes = new NoteManager(this.core.notes ?? (this.core.notes = []));

		this.core.decks = this.core.decks?.map(Deck.from) ?? [];
	}

	public getOrCreateDeck(deckId?: string, deckType?: DeckType): Deck {
		const decks = this.core.decks as Deck[] ?? (this.core.decks = []);
		let deck = deckId ? decks.find(d => d.id === deckId) : decks[0];
		if (!deck) {
			deck = Deck.createDeck(deckType);
			decks.push(deck);
		}
		return deck;
	}
	public hasDeck(deckId: string) { return this.core.decks?.some(d => d.id === deckId) ?? false; }
	public get hasDecks() { return (this.core.decks?.length ?? 0) > 0; }

	/** nickname (aka); @todo phase out nickname as a note/stat */
	public get aka(): string | undefined { return this.core.aka ?? this.getNoteStat("nickname"); }
	public set aka(aka: string | undefined) { this.core.aka = aka; this.notes.setStat("nickname", ""); }

	/** short name used to ease dialog access */
	public get alias(): string | undefined {
		return this.core.alias;
	}
	public set alias(alias: string | undefined) {
		this.core.alias = alias;
		delete this._aliasMatcher;
	}
	/** stores the clean alias used for matching */
	private _aliasMatcher?: StringMatcher;
	/** returns the clean alias used for matching */
	public get aliasMatcher(): StringMatcher {
		return this._aliasMatcher ??= StringMatcher.from(this.core.alias);
	}

	/** Channels to automatically treat input as dialog */
	public get autoChannels(): AutoChannelData[] { return this.core.autoChannels ??= []; }

	/** The image used for the right side of the dialog */
	public get avatarUrl(): string | undefined { return this.core.avatarUrl; }
	public set avatarUrl(avatarUrl: string | undefined) { this.core.avatarUrl = avatarUrl; }

	/** The character's companion characters. */
	public get companions(): CharacterManager { return this.core.companions as CharacterManager; }

	/** Convenient way of getting the displayName.template stat */
	public get displayNameTemplate(): string | undefined { return this.getNoteStat("displayName.template"); }
	public set displayNameTemplate(displayNameTemplate: string | undefined) { this.notes.setStat("displayName.template", displayNameTemplate ?? ""); }

	/** Discord compatible color: #001122 */
	public get embedColor(): HexColorString | undefined { return this.core.embedColor; }
	public set embedColor(embedColor: HexColorString | undefined) { this.core.embedColor = embedColor; }

	/** Unique ID of this character */
	public get id(): Snowflake { return this.core.id; }

	public get isGm(): boolean { return this.type === "gm"; }
	public get isNpc(): boolean { return this.type === "npc"; }
	public get isMinion(): boolean { return this.type === "minion"; }
	public get isGmOrNpc(): boolean { return this.isGm || this.isNpc; }
	public get isGmOrNpcOrMinion(): boolean { return this.isGm || this.isNpc || this.isMinion; }
	public get isPc(): boolean { return this.type === "pc"; }
	public get isCompanion(): boolean { return this.type === "companion"; }
	public get isPcOrCompanion(): boolean { return this.isPc || this.isCompanion; }
	public get isCompanionOrMinion(): boolean { return this.isCompanion || this.isMinion; }

	/** A list of the character's last messages by channel. */
	public get lastMessages(): DialogMessageData[] { return this.core.lastMessages as DialogMessageData[]; }

	public get macros() { return this.core.macros ?? (this.core.macros = []); }

	/** The character's name */
	public get name(): string {
		return this.core.name;
	}
	public set name(name: string) {
		this.core.name = name;
		delete this._nameMatcher;
	}
	/** stores the clean name used for matching */
	private _nameMatcher?: StringMatcher;
	/** returns the clean name used for matching */
	public get nameMatcher(): StringMatcher {
		return this._nameMatcher ??= StringMatcher.from(this.core.name);
	}

	/** The character's notes */
	public notes: NoteManager;

	private _parent?: GameCharacter | null;
	/** The parent of a companion. */
	public get parent(): GameCharacter | undefined {
		if (this._parent === undefined) {
			// Due to the .owner property not being public, I have to cast it as any ...
			/** @todo: FIND A BETTER WAY! */
			this._parent = this.isCompanionOrMinion && this.owner ? (this.owner as any).owner ?? null : null;
		}
		return this._parent ?? undefined;
	}
	/** The ID of the parent of a companion. */
	public get parentId(): Snowflake | undefined { return this.parent?.id; }

	public get scope() {
		const { owner } = this;
		if (!owner) {
			return "Unknown";
		}
		return owner.scope;
	}

	private _essence20: TEssence20Character | null | undefined;
	public get essence20(): TEssence20Character | null {
		if (this._essence20 === undefined) {
			if (this.core.essence20) {
				this._essence20 = loadCharacterCore(this.core.essence20) ?? null;
			}
			if (this.core.essence20Id) {
				this._essence20 = loadCharacterSync(this.core.essence20Id) ?? null;
			}
		}
		return this._essence20 ?? null;
	}

	/** @todo figure out what this id is and what it represents */
	public get essence20Id(): string | undefined { return this.core.essence20Id; }
	public set essence20Id(essence20Id: Optional<string>) { this.core.essence20Id = essence20Id ?? undefined; }

	private _pathbuilder: PathbuilderCharacter | null | undefined;
	public get pathbuilder(): PathbuilderCharacter | null {
		if (this._pathbuilder === undefined) {
			if (this.core.pathbuilder) {
				this._pathbuilder = new PathbuilderCharacter(this.core.pathbuilder);
			}
			if (this.core.pathbuilderId) {
				this._pathbuilder = PathbuilderCharacter.loadCharacterSync(this.core.pathbuilderId) ?? null;
			}
		}
		return this._pathbuilder ?? null;
	}

	/** @todo figure out what this id is and what it represents */
	public get pathbuilderId(): string | undefined { return this.core.pathbuilderId; }
	public set pathbuilderId(pathbuilderId: Optional<string>) { this.core.pathbuilderId = pathbuilderId ?? undefined; }

	/** The image used to represent the character to the left of the post. */
	public get tokenUrl(): string | undefined { return this.core.tokenUrl; }
	public set tokenUrl(tokenUrl: string | undefined) { this.core.tokenUrl = tokenUrl; }

	public get type(): TGameCharacterType { return this.owner?.characterType ?? "gm"; }

	/** The character's user's Discord ID */
	public get userDid(): Snowflake | undefined { return this.core.userDid; }
	public set userDid(userDid: Snowflake | undefined) { this.core.userDid = userDid; }

	//#region AutoChannels

	public getAutoChannel(data: AutoChannelData): AutoChannelData | null {
		return this.autoChannels.find(ch => ch.channelDid === data.channelDid && ch.userDid === data.userDid) ?? null;
	}

	public setAutoChannel(data: AutoChannelData, save = true): Promise<boolean> {
		const autoChannel = this.getAutoChannel(data);
		if (autoChannel && autoChannel.dialogPostType !== data.dialogPostType) {
			this.removeAutoChannel(data);
		}
		this.autoChannels.push(data);
		if (save) {
			return this.save();
		}
		return Promise.resolve(false);
	}

	public clearAutoChannels(save = true): Promise<boolean> {
		if (this.autoChannels.length > 0) {
			this.core.autoChannels = [];
			if (save) {
				return this.save();
			}
		}
		return Promise.resolve(false);
	}

	public hasAutoChannel(data: AutoChannelData): boolean {
		return !!this.getAutoChannel(data);
	}

	public removeAutoChannel(data: AutoChannelData, save = true): Promise<boolean> {
		const autoChannels = this.autoChannels;
		const index = autoChannels.indexOf(this.getAutoChannel(data)!);
		if (index > -1) {
			autoChannels.splice(index, 1);
			if (save) {
				return this.save();
			}
		}
		return Promise.resolve(false);
	}

	//#endregion

	//#region LastMessage(s)

	/** Returns the last dialog message for this character in the given channel. */
	// public getLastMessage(channelId: Snowflake): DialogMessageData | undefined {
	// 	return this.lastMessages.find(dm => dm.matchesChannel(channelId));
	// }

	/** Returns the last dialog messages for this character and all its companions in the given channel. */
	// public getLastMessages(channelId: Snowflake): DialogMessageData[] {
	// 	const dialogMessages: DialogMessageData[] = [];

	// 	// grab this character's last message
	// 	const lastMessage = this.getLastMessage(channelId);
	// 	if (lastMessage) {
	// 		dialogMessages.push(lastMessage);
	// 	}

	// 	// include all companion last messages
	// 	this.companions.forEach(companion => {
	// 		dialogMessages.push(...companion.getLastMessages(channelId));
	// 	});

	// 	// lastMessages.sort((a, b) => a.timestamp - b.timestamp);
	// 	return dialogMessages;
	// }

	/**
	 * Sets the last dialog message for this character.
	 * Last dialog messages are stored for each channel, so we filter out messages for the channel before adding the given message.
	 */
	public setLastMessage(dialogMessage: DialogMessageData): void {
		this.core.lastMessages = this.lastMessages.filter(messageInfo => !dialogMessage.matchesChannel(messageInfo));
		this.core.lastMessages.push(dialogMessage);
	}

	//#endregion

	/** Compares id, name literal, alias literal, then nameMatcher and aliasMatcher. If recursive, it also checks companions. */
	public matches(value: string, recursive = false): boolean {
		if (this.name === value || this.alias === value || this.id === value) {
			return true;
		}
		if (StringMatcher.from(value).matchesAny(this.nameMatcher, this.aliasMatcher)) {
			return true;
		}
		return recursive && this.companions.hasMatching(value, true);
	}

	public toDisplayName(template?: string): string {
		const templated = processCharacterTemplate(this, "displayName", template);
		if (templated.value) {
			return templated.value;
		}
		if (this.isGmOrNpcOrMinion) {
			const descriptors = this.toNameDescriptors();
			if (descriptors.length) {
				return `${this.name} (${descriptors.join(" ")})`;
			}
		}
		return this.name;
	}

	/**
	 * provides descriptors for the character.
	 * if `nameDescriptors.template` exists, it will be processed and then split by commas.
	 * otherwise:
	 *   pcs will return ["ancestry (heritage)", "class/dualClass level"]
	 *   npcs will return ["descriptor", "gender", "ancestry", "background"]
	 */
	public toNameDescriptors(): string[] {
		const template = processCharacterTemplate(this, "nameDescriptors");
		if (template.value) {
			return template.value
				.split(",")
				.filter(isNotBlank)
				.map(s => s.trim());
		}

		const descriptors: string[] = [];
		const push = (value: Optional<string>) => {
			if (isNotBlank(value)) descriptors.push(value.trim());
		};

		// possibly used by both pcs / npcs
		const ancestry = stringOrUndefined(this.getString("aDescriptor") ?? this.getString("ancestry"));
		const heritage = stringOrUndefined(this.getString("hDescriptor") ?? this.getString("heritage"));
		const klass = this.getString("class");

		if (this.isPcOrCompanion) {
			// ancestry (heritage)
			if (ancestry && heritage) {
				push(`${ancestry} (${heritage})`);
			}else {
				push(ancestry ?? heritage);
			}

			// class/dualClass level
			const classes = stringOrUndefined([klass, this.getString("dualClass")].filter(isNotBlank).map(s => s.trim()).join("/"));
			const level = this.getNumber("level")?.toString();
			if (classes && level) {
				push(`${classes} ${level}`);
			}else {
				push(classes);
			}

		}else {
			// generic descriptor
			push(this.getString("descriptor"));

			// gender
			push(this.getString("gDescriptor") ?? this.getString("gender"));

			// ancestry / heritage
			push(ancestry ?? heritage);

			// background / class
			push(this.getString("bDescriptor") ?? this.getString("background") ?? klass);
		}

		return descriptors;
	}

	public toSheetLink(): string | undefined {
		return this.getString("sheet.link");
	}
	public toDialogFooterLine(template?: string): string | undefined {
		return processCharacterTemplate(this, "dialogFooter", template).value;
	}

	public toJSON(): GameCharacterCore {
		return this.core;
	}

	public async remove(): Promise<boolean> {
		let manager: CharacterManager | undefined;
		if (this.owner instanceof GameCharacter) {
			manager = this.owner.companions;
		} else if (this.owner instanceof CharacterManager) {
			manager = this.owner;
		}
		if (!manager) return false;
		const found = manager.findByName(this.name);
		if (!found) return false;
		const index = manager.indexOf(found);
		if (index < 0) return false;
		const removed = manager.splice(index, 1)[0];
		if (!removed) return false;
		return await manager.save() ?? false;
	}

	private fetchedStats: Map<Lowercase<string>, { key:string; keyLower:Lowercase<string>; value:string; }> | undefined;
	private fetchedMacros: MacroBase[] | undefined;
	public async fetchStats(): Promise<void> {
		if (!this.fetchedStats) {
			const url = urlOrUndefined(this.getNoteStat("stats.tsv.url"));
			if (url) {
				const raw = await getText(url).catch(errorReturnUndefined);
				if (raw) {
					const { stats, macros } = parseFetchedStats(raw, this.alias);
					this.fetchedStats = stats;
					this.fetchedMacros = macros;
					return;
				}
			}
			this.fetchedStats = new Map();
			this.fetchedMacros = [];
		}
	}
	public async fetchMacros(): Promise<MacroBase[]> {
		await this.fetchStats();
		return this.fetchedMacros ?? [];
	}

	public get gameSystem(): GameSystem | undefined {
		const gameSystem = parseGameSystem(this.getNoteStat("gameSystem"))
			?? this.owner?.gameSystem;

		if (this.pathbuilder) {
			if (gameSystem?.isP20) {
				return gameSystem;
			}
			/** @todo check for sf2e */
			return parseGameSystem("PF2E");
		}

		if (this.essence20) {
			if (gameSystem?.code === "E20") {
				return gameSystem;
			}
			return parseGameSystem("e20");
		}

		return gameSystem;
	}

	public get hasStats(): boolean { return this.getNoteStats().length > 0; }

	public toStatsOutput() {
		// get full list of stats
		let statsToMap = this.getNoteStats();

		// prep some values
		const sorter = sortByKey("title");

		const processTemplateKeys = () => {
			const templateKeyTester = /\.template(\.title)?$/i;
			const templateStats = statsToMap.filter(({ title }) => templateKeyTester.test(title));
			templateStats.sort(sorter);
			return {
				keys: new Set<Lowercase<string>>(templateStats.map(({ title }) => title.toLowerCase() as Lowercase<string>)),
				title: "Templates",
				lines: templateStats.map(note => `<b>${note.title}</b> ${note.note}`)
			};
		};

		const { keys: simpleKeys, title: simpleTitle, lines: simpleLines } = processSimpleSheet(this);
		const { keys: customKeys, title: customTitle, lines: customLines } = processCharacterTemplate(this, "customSheet");
		const { keys: templateKeys, title: templateTitle, lines: templateLines } = processTemplateKeys();

		const usedKeys = new Set<Lowercase<string>>([...simpleKeys, ...customKeys, ...templateKeys]);

		// remove keys used in simple sheet, custom sheet, or template stats
		statsToMap = statsToMap.filter(note => !usedKeys.has(note.title.toLowerCase() as Lowercase<string>));
		statsToMap.sort(sorter);

		const otherTitle = simpleLines.length || customLines.length ? `Other Stats` : `Stats`;
		const otherLines = statsToMap.map(note => `<b>${note.title}</b> ${note.note}`);

		return [
			{ title: simpleTitle, lines: simpleLines },
			{ title: customTitle, lines: customLines },
			{ title: otherTitle, lines: otherLines },
			{ title: templateTitle, lines: templateLines },
		];
	}

	public getHpGauge(): string {
		let hpStat = this.getString("hp") ?? "0";
		if (/^\|\|\d+\|\|$/.test(hpStat)) hpStat = hpStat.slice(2, -2);
		const hp = +hpStat;

		let maxHpStat = this.getString("maxHp") ?? "0";
		if (/^\|\|\d+\|\|$/.test(maxHpStat)) maxHpStat = maxHpStat.slice(2, -2);
		const maxHp = +maxHpStat;

		return hpToGauge(hp, maxHp);
	}

	/** returns the value for the given key */
	public getNumber(key: string): number | undefined {
		const stat = this.getStat(key, true);
		return stat.isDefined ? numberOrUndefined(stat.value) : undefined;
	}

	/** returns the value for the given key */
	public getString(key: string): string | undefined {
		const stat = this.getStat(key, true);
		return stat.isDefined ? stringOrUndefined(String(stat.value)) : undefined;
	}

	/** returns all notes that are stats */
	private getNoteStats() {
		return this.notes.getStats();
	}

	/** returns the value (trimmed) of the first note found or undefined */
	private getNoteStat(...keys: string[]): string | undefined {
		for (const key of keys) {
			const value = this.notes.getStat(key)?.note.trim();
			if (value) return value;
		}
		return undefined;
	}

	private getNoteKeyAndStat(...keys: string[]): { key:string; value:string; } | undefined {
		for (const key of keys) {
			const stat = this.notes.getStat(key);
			if (stat) {
				const value = stat.note.trim();
				if (value) {
					return { key:stat.title, value:value };
				}
			}
		}
		return undefined;
	}

	/** @deprecated start using getNumber or getString */
	public getStat(key: string): string | null;
	/** @deprecated start using getNumber or getString */
	public getStat(key: string, includeKey: true): StatResults<string>;
	public getStat(key: string, includeKey?: boolean): StatResults<string> | string | null {
		const keyLower = key.toLowerCase() as Lowercase<string>;

		// shortcut to easily return as the args request
		const ret = (casedKey = key, value: Optional<number | string> = null) => {
			const _isDefined = isDefined(value);
			const _value = _isDefined && !isString(value) ? String(value) : value ?? null;
			return includeKey
				? { isDefined:_isDefined, key:casedKey, keyLower, value:_value } as StatResults<string>
				: _value;
		};

		// no key, no value
		if (!key.trim()) return ret(key, null);

		//#region universal non-note stats or helpers

		if (keyLower === "name") {
			return ret("name", this.name);
		}

		if (keyLower === "namedescriptors" || keyLower === "csv.namedescriptors") {
			const isCsv = keyLower.startsWith("csv");
			const descriptors = this.toNameDescriptors();
			const separator = isCsv ? ", " : " ";
			return ret(isCsv ? "csv.nameDescriptors" : "nameDescriptors", descriptors.length ? descriptors.join(separator) : null);
		}

		if (keyLower === "alias") {
			return ret("alias", this.alias);
		}

		/** @todo check the data to see if these are even in use */
		if (["aka","nname","nickname"].includes(keyLower)) {
			return ret("nickname", this.aka);
		}
		if ("nickorname" === keyLower) {
			return ret("nickOrName", this.aka ?? this.name);
		}

		if (keyLower === "hpgauge") {
			return ret("hpGauge", this.getHpGauge());
		}

		// enforce sheet.url and stop using sheeturl
		if (keyLower === "sheet.url" || keyLower === "sheeturl") {
			let sheetUrl = this.getNoteStat("sheet.url", "sheeturl");
			if (sheetUrl === "on") {
				const { sheetRef } = this.essence20 ?? this.pathbuilder ?? { };
				if (sheetRef?.channelId) {
					sheetUrl = toMessageUrl(sheetRef);
				}
			}
			const validUrl = urlOrUndefined(sheetUrl);
			return ret("sheet.url", validUrl ? wrap(validUrl, "<>") : null);
		}
		if (keyLower === "sheet.link") {
			const sheetUrl = this.getString("sheet.url");
			return ret("sheet.link", sheetUrl ? `[✎](${sheetUrl})` : sheetUrl);
		}

		//#endregion

		//#region universal calculated stats

		// divide the stat by 2 and round up
		const halfUp = keyLower.startsWith("half.up.");
		// divide the stat by 2 and round down
		const halfDn = keyLower.startsWith("half.dn.");

		if (halfUp || halfDn) {
			const statKey = key.slice(8);
			const { key:casedKey, value:statValue } = this.getStat(statKey, true);
			if (statValue) {
				const retKey = `half.${halfUp ? "up" : "dn"}.${casedKey}`;
				const mathedValue = doStatMath(`(${statValue})`);
				const numberValue = numberOrUndefined(mathedValue);
				if (numberValue === undefined) {
					return ret(retKey, `isNaN(${statValue})`);
				}
				const fn = halfUp ? Math.ceil : Math.floor;
				return ret(retKey, fn(numberValue / 2));
			}
		}

		//#endregion

		// get custom stat added via message posts
		const noteStat = this.getNoteKeyAndStat(key);
		if (noteStat !== undefined) {
			return ret(noteStat.key, noteStat.value);
		}

		// get stats fetched from "stats.tsv.url"
		const fetchedStat = this.fetchedStats?.get(keyLower);
		if (fetchedStat) {
			return ret(fetchedStat.key, fetchedStat.value);
		}

		// get stats from underlying e20 character
		const { essence20 } = this;
		if (essence20) {
			const e20Stat = essence20.getStat(key, keyLower);
			if (e20Stat.isDefined) {
				return ret(e20Stat.key, String(e20Stat.value));
			}
		}

		// get stats from underlying pathbuilder character
		const { pathbuilder } = this;
		if (pathbuilder) {
			let pbKey = key;
			if (keyLower === "explorationmode") pbKey = "activeExploration";
			else if (keyLower === "explorationskill") pbKey = "initSkill";
			const pbStat = pathbuilder.getStat(pbKey);
			if (pbStat.isDefined) {
				return ret(pbStat.key, String(pbStat.value));
			}
		}

		// provide a temp shortcut for calculating stat modifiers for d20 games
		const abilities = ["strength","dexterity","constitution","intelligence","wisdom","charisma"];
		for (const ability of abilities) {
			const isAbbr = ability.slice(0, 3) === keyLower;
			if (isAbbr || `mod.${ability}` === keyLower) {
				const abilityStat = this.getStat(ability, true);
				if (abilityStat.value !== undefined) {
					const retKey = isAbbr ? capitalize(abilityStat.key.slice(0, 3)) : `mod.${abilityStat.key}`;
					return ret(retKey, processMath(`floor((${abilityStat.value}-10)/2)`, { allowSpoilers:true }));
				}
			}
		}

		// provide a temp shortcut for d20 based coins/currency
		if (keyLower === "currency" || keyLower === "currency.raw") {
			const curr = this.getCurrency();

			// they don't want raw, so simplify it
			if (keyLower === "currency") {
				return ret("currency", curr.simplify().toString());
			}

			return ret("currency.raw", curr.toString());
		}

		// if we don't have hp, let's try using maxHp
		if (keyLower === "hp") {
			return ret("hp", this.getNumber("maxHp"));
		}

		const { gameSystem } = this;
		if (pathbuilder || gameSystem?.isP20) {
			const p20Stat = this.getStatP20(key, keyLower);
			return ret(p20Stat.key, p20Stat.value);
		}

		/** @todo by doing this we are ensuring that users are able to keep using these functions that they may not have known were specific to pf2e */
		if (!gameSystem) {
			const p20Stat = this.getStatP20(key, keyLower);
			return ret(p20Stat.key, p20Stat.value);
		}

		return ret();
	}

	protected getStatP20(key: string, keyLower = key.toLowerCase() as Lowercase<string>): StatResults<string | number, undefined> {
		// return value creator
		const ret = (casedKey = key, value: Optional<number | string> = undefined) => (
			{ isDefined:isDefined(value), key:casedKey, keyLower, value:value??undefined } as StatResults<string | number, undefined>
		);

		// provide a shortcut for off-guard ac
		if (keyLower === "ogac") {
			const acStat = this.getStat("ac", true);
			if (acStat.isDefined) {
				return ret(keyLower, doStatMath(`(${acStat.value}-2)`));
			}
		}

		// provide a shortcut for cantrip rank
		if (keyLower === "cantrip.rank") {
			return ret(keyLower, this.getStat(`half.up.level`, true).value);
		}

		// provide a shortcut for dc values
		if (keyLower.startsWith("dc.")) {
			const statKey = key.slice(3);
			const stat = this.getStat(statKey, true);
			if (stat.isDefined) {
				return ret(`dc.${stat.key}`, doStatMath(`(${stat.value}+10)`));
			}
		}

		if (keyLower === "conditions") {
			const conditions: string[] = [];

			Condition.ToggledConditions.forEach(condition => {
				if (this.getString(condition) !== undefined) {
					const riders = Condition.getConditionRiders(condition);
					const riderText = riders.length ? ` (${riders.join(", ")})` : ``;
					conditions.push(condition + riderText);
				}
			});

			Condition.ValuedConditions.forEach(condition => {
				const value = this.getString(condition);
				if (value !== undefined) {
					conditions.push(`${condition} ${value}`);
				}
			});

			conditions.sort();

			return ret(keyLower, conditions.join(", "));
		}

		return ret();
	}

	public getCurrency() {
		// try getting currency from gameSystem
		let currency = Currency.new<CurrencyPf2e>(this.gameSystem?.code);

		// otherwise see if we are SF2e
		if (!currency && (this.getNumber("credits") || this.getNumber("upb"))) {
			currency = Currency.new("SF2e");
		}

		// otherwise see if we are DnD5e
		if (!currency && (this.getNumber("ep"))) {
			currency = Currency.new("DnD5e");
		}

		// otherwise default to PF2e
		if (!currency) {
			currency = Currency.new("PF2e")!;
		}

		// create core using keys for this currency
		const raw = currency.denominationKeys.reduce((core, denom) => {
			const value = this.getNumber(denom);
			if (value) core[denom] = value;
			return core;
		}, {} as DenominationsCore<any>);

		// parse to properly load up denominations with a negative value
		const constr = currency.constructor as typeof Currency;
		return constr.parse(raw) as CurrencyPf2e;
	}

	public async processStatsAndMods(stats?: TKeyValuePair[], mods?:StatModPair[]): Promise<StringSet> {
		const keysModdedAndUpdated = new StringSet();

		const updateStats = async (pairs: TKeyValuePair[]) => {
			const keysUpdated = await this.updateStats(pairs, false);
			keysUpdated.forEach(key => keysModdedAndUpdated.add(key));
		};

		if (stats?.length) {
			await updateStats(stats);
		}

		if (mods?.length) {
			const curr = this.getCurrency();
			let currModded = false;

			const processPair = async (pair: StatModPair) => {
				const oldValue = this.getString(pair.key) ?? 0;
				const math = `(${oldValue}${pair.modifier}${pair.value})`;
				const newValue = doStatMath(math);
				await updateStats([{ key:pair.key, value:newValue }]);
			};

			for (const pair of mods) {
				const keyLower = pair.key.toLowerCase();

				// if denomination, handle it separately
				if (curr.hasDenomination(keyLower)) {
					const number = numberOrUndefined(pair.value);
					if (number) {
						curr.math(pair.modifier!, number, keyLower);
						currModded = true;
					}
				}

				// if subtracting hp, check to see if we need to also subtract from temphp
				else if (keyLower === "hp" && pair.modifier === "-") {
					let hpDelta = numberOrUndefined(pair.value);
					if (hpDelta) {
						const tempHp = this.getNumber("temphp") ?? 0;
						if (!tempHp) {
							await processPair(pair);
						}else if (tempHp >= hpDelta) {
							await processPair({ key:"tempHp", modifier:"-", value:String(hpDelta) });
						}else {
							hpDelta -= tempHp;
							await processPair({ key:"tempHp", modifier:"-", value:String(tempHp) });
							await processPair({ key:"hp", modifier:"-", value:String(hpDelta) });
						}
					}
				}

				// finally do basic processing
				else {
					await processPair(pair);
				}
			}

			// if we modded the currency data, we still gotta update the stats themselves
			if (currModded) {
				await updateStats(curr.denominationKeys.map(denom => ({ key:denom, value:String(curr[denom]) })));
			}
		}

		return keysModdedAndUpdated;
	}

	/** returns keys (lowercased) updated */
	public async updateStats(pairs: TKeyValuePair[], save: boolean): Promise<StringSet> {
		const keysUpdated = new StringSet();

		const forNotes: TKeyValuePair[] = [];
		const p20 = this.pathbuilder;
		const e20 = this.essence20;
		for (const { key, value:valueOrNull } of pairs) {
			const keyLower = key.toLowerCase();

			const value = valueOrNull ?? "";
			if (keyLower === "name" && value?.trim() && (this.name !== value || (p20 && p20.name !== value) || (e20 && e20.name !== value))) {
				this.name = value;
				if (p20) p20.name = value;
				if (e20) e20.name = value;
				keysUpdated.add(keyLower);
				continue;
			}

			let correctedKey: string | undefined;
			let correctedValue: string | undefined;
			const isExplorationMode = keyLower === "explorationmode";
			const isExplorationSkill = keyLower === "explorationskill";
			if (isExplorationMode || isExplorationSkill) {
				const matchValue = (val: string) => new RegExp(`^${val.replace(/(\s)/g, "$1?")}$`, "i").test(value);
				if (isExplorationMode) {
					correctedKey = "explorationMode";
					correctedValue = getExplorationModes().find(matchValue);
				}
				if (isExplorationSkill) {
					correctedKey = "explorationSkill";
					correctedValue = getSkills().find(matchValue);
				}
			}

			if (p20) {
				if (keyLower === "level" && +value) {
					const updatedLevel = await p20.setLevel(+value, save);
					if (updatedLevel) {
						this.notes.setStat("level", "");
						keysUpdated.add(keyLower);
					}
					continue;
				}

				if (["cp","sp","gp","pp","credits","upb"].includes(keyLower)) {
					const keyLower = key.toLowerCase() as keyof TPathbuilderCharacterMoney;
					const money = { } as TPathbuilderCharacterMoney;
					money[keyLower] = +value;
					const updatedMoney = await p20.setMoney(money, save);
					if (updatedMoney) {
						this.notes.setStat(keyLower, "");
						keysUpdated.add(keyLower);
					}
					continue;
				}

				if (isExplorationMode) {
					p20.setSheetValue("activeExploration", correctedValue ?? "Other");
					const unset = this.notes.setStat(correctedKey ?? key, "");
					if (unset) keysUpdated.add(correctedKey ?? key);
					continue;
				}

				if (isExplorationSkill) {
					p20.setSheetValue("activeSkill", correctedValue ?? "Perception");
					const unset = this.notes.setStat(correctedKey ?? key, "");
					if (unset) keysUpdated.add(correctedKey ?? key);
					continue;
				}

				// abilities?
				// proficiencies?
			}
			forNotes.push({ key:correctedKey??key, value:correctedValue??value });
		}

		// iterate the stat pairs to double check bounds
		forNotes.forEach(pair => pair.value = checkStatBounds(this, pair) ?? pair.value);

		const updatedNoteKeys = this.notes.updateStats(forNotes);
		updatedNoteKeys.forEach(noteKey => keysUpdated.add(noteKey));

		return keysUpdated;
	}

	public async update({ alias, avatarUrl, embedColor, name, pathbuilder, pathbuilderId, tokenUrl, userDid }: Args<GameCharacterCore>, save = true): Promise<boolean> {
		// we only use the values that are changable, leaving the needed arrays intact
		let changed = applyChanges(this.core, { alias, avatarUrl, embedColor, pathbuilder, pathbuilderId, tokenUrl, userDid });

		// name is tricky cause we can update via alias in name field; do it separate
		if (name) {
			// we don't wanna edit the name if we are simply using the alias to update
			const notAlias = !this.aliasMatcher.matches(name);
			// if the name and alias are the same then we can update the name
			const aliasMatchesName = this.nameMatcher.matches(this.aliasMatcher);
			if (notAlias || aliasMatchesName) {
				this.name = name;
				changed = true;
			}
		}

		if (changed) {
			delete this._aliasMatcher;
			delete this._nameMatcher;
			delete this._pathbuilder;
			if (save) {
				return this.save();
			}
		}
		return false;
	}

	public async save(saveImported?: boolean): Promise<boolean> {
		const ownerSaved = await this.owner?.save() ?? false;
		if (ownerSaved && saveImported) {
			if (this.pathbuilderId) {
				return await this.pathbuilder?.save() ?? false;
			}
			if (this.essence20Id) {
				return await this.essence20?.save() ?? false;
			}
		}
		return ownerSaved;
	}

	public static readonly defaultGmCharacterName = DEFAULT_GM_CHARACTER_NAME;

	public static async fromTemp(ids: TempIds): Promise<GameCharacter | undefined> {
		const path = createTempPath(ids);
		if (fileExistsSync(path)) {
			const core = await readJsonFile<GameCharacterCore>(path);
			if (core) {
				return new GameCharacter(core);
			}
		}
		return undefined;
	}

	public async saveTemp(ids: Omit<TempIds, "charId">): Promise<boolean> {
		const path = createTempPath({ charId:this.id, ...ids });
		return writeFile(path, this.core);

	}
}

