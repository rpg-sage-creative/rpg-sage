import { DEFAULT_GM_CHARACTER_NAME, parseGameSystem, type DialogPostType } from "@rsc-sage/types";
import { applyChanges, Color, errorReturnUndefined, getDataRoot, isBlank, isWrapped, unwrap, wrap, type Args, type HexColorString, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { doStatMath } from "@rsc-utils/dice-utils";
import { DiscordKey, toMessageUrl } from "@rsc-utils/discord-utils";
import { fileExistsSync, getText, isUrl, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { mkdirSync } from "fs";
import XRegExp from "xregexp";
import { checkStatBounds } from "../../../gameSystems/checkStatBounds.js";
import { Condition } from "../../../gameSystems/p20/lib/Condition.js";
import { isStatsKey } from "../../../gameSystems/sheets.js";
import { getExplorationModes, getSkills } from "../../../sage-pf2e/index.js";
import { PathbuilderCharacter, type TPathbuilderCharacter } from "../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { Deck, type DeckCore, type DeckType } from "../../../sage-utils/utils/GameUtils/deck/index.js";
import type { StatModPair } from "../commands/admin/GameCharacter/getCharacterArgs.js";
import { loadCharacterCore, loadCharacterSync, type TEssence20Character, type TEssence20CharacterCore } from "../commands/e20.js";
import { DialogMessageData, type DialogMessageDataCore } from "../repo/DialogMessageRepository.js";
import { CharacterManager } from "./CharacterManager.js";
import type { MacroBase } from "./Macro.js";
import type { IHasSave } from "./NamedCollection.js";
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
	const stats = new Map<string, string>();
	const macros: MacroBase[] = [];
	const lines = raw.split(/[\n\r]+/).map(line => line.split(/\t/).map(val => val.trim()));
	lines.forEach(line => {
		const results = parseFetchedStatsLine(line, alias);
		if (results) {
			if ("dialog" in results || "dice" in results) macros.push(results); // || "items" in results || "math" in results || "table" in results || "tableUrl" in results
			if ("value" in results) stats.set(results.key, results.value);
		}
	});
	return { stats, macros };
}
function parseFetchedStatsLine(values: string[], alias?: string) {
	const setAlias = (value?: string) => value && alias ? value.replace(/\{::/g, `{${alias}::`) : value;
	const shift = () => setAlias(values.shift()?.trim());
	const key = shift()?.toLowerCase();
	if (!key) return undefined;
	const value = shift();
	if (!value) return undefined;
	if (key === "macro") {
		const three = shift(), four = shift();
		if (four && isWrapped(four, "[]")) {
			return { name:value, category:three, dice:four } as MacroBase;
		}
		if (three && isWrapped(three, "[]")) {
			return { name:value, dice:three } as MacroBase;
		}

	}
	return { key, value };
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

export class GameCharacter implements IHasSave {
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

	/** nickname (aka) */
	public get aka(): string | undefined { return this.core.aka ?? this.notes.getStat("nickname")?.note.trim(); }
	public set aka(aka: string | undefined) { this.core.aka = aka; this.notes.setStat("nickname", ""); }

	/** short name used to ease dialog access */
	public get alias(): string | undefined {
		return this.core.alias;
	}
	public set alias(alias: string | undefined) {
		this.core.alias = alias;
		delete this._aliasForMatching;
	}
	/** stores the clean alias used for matching */
	private _aliasForMatching?: string;
	/** returns the clean alias used for matching */
	public get aliasForMatching(): string {
		return this._aliasForMatching ?? (this._aliasForMatching = GameCharacter.prepareForMatching(this.alias ?? this.name));
	}

	/** Channels to automatically treat input as dialog */
	public get autoChannels(): AutoChannelData[] { return this.core.autoChannels ?? (this.core.autoChannels = []); }

	/** The image used for the right side of the dialog */
	public get avatarUrl(): string | undefined { return this.core.avatarUrl; }
	public set avatarUrl(avatarUrl: string | undefined) { this.core.avatarUrl = avatarUrl; }

	/** The character's companion characters. */
	public get companions(): CharacterManager { return this.core.companions as CharacterManager; }

	/** Convenient way of getting the displayName.template stat */
	public get displayNameTemplate(): string | undefined {
		return this.getStat("displayName.template") ?? undefined;
	}
	public set displayNameTemplate(displayNameTemplate: string | undefined) {
		this.notes.setStat("displayName.template", displayNameTemplate ?? "");
	}

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
		delete this._nameForMatching;
		delete this._aliasForMatching;
	}
	/** stores the clean name used for matching */
	private _nameForMatching?: string;
	/** returns the clean name used for matching */
	public get nameForMatching(): string {
		return this._nameForMatching ?? (this._nameForMatching = GameCharacter.prepareForMatching(this.name));
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

	/** Compares id, name literal, alias literal, then preparedName and preparedAlias. If recursive, it also checks companions. */
	public matches(value: string, recursive = false): boolean {
		if (this.name === value || this.alias === value || this.id === value) {
			return true;
		}
		const preparedValue = GameCharacter.prepareForMatching(value);
		if (this.nameForMatching === preparedValue || this.aliasForMatching === preparedValue) {
			return true;
		}
		return recursive && this.companions.hasMatching(value, true);
	}

	public toDisplayName(template?: string): string {
		if (isBlank(template)) {
			template = this.displayNameTemplate;
		}
		if (!isBlank(template)) {
			return template.replace(/{[^}]+}/g, match => this.getStat(match.slice(1, -1)) ?? match);
		}
		return this.name;
	}

	public toJSON(): GameCharacterCore {
		return this.core;
	}

	public remove(): Promise<boolean> {
		if (this.owner instanceof GameCharacter) {
			return this.owner.companions.removeAndSave(this);
		} else if (this.owner instanceof CharacterManager) {
			return this.owner.removeAndSave(this);
		}
		return Promise.resolve(false);
	}

	private fetchedStats: Map<string, string> | undefined;
	private fetchedMacros: MacroBase[] | undefined;
	public async fetchStats(): Promise<void> {
		if (!this.fetchedStats) {
			const url = this.notes.getStat("stats.tsv.url")?.note;
			if (isUrl(url, { wrapChars:"<>", wrapOptional:true })) {
				const raw = await getText(unwrap(url, "<>")).catch(errorReturnUndefined);
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

	public get gameSystem() {
		return parseGameSystem(this.notes.getStat("gameSystem")?.note);
	}

	public get hasStats(): boolean { return this.notes.getStats().length > 0; }

	public getNonGameStatsOutput(): string[] {
		const { gameSystem } = this;
		const allStatsNotes = this.notes.getStats();
		const nonGameStatsNotes = gameSystem ? allStatsNotes.filter(note => !isStatsKey(note.title, gameSystem)) : allStatsNotes;
		const sortedNonGameStatsNotes = nonGameStatsNotes.sort((a, b) => a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1);
		return sortedNonGameStatsNotes.map(note => `<b>${note.title}</b> ${note.note}`);
	}

	public getHpGauge(): string {
		let hpStat = this.getStat("hp") ?? "0";
		if (/^\|\|\d+\|\|$/.test(hpStat)) hpStat = hpStat.slice(2, -2);
		const hp = +hpStat;

		let maxHpStat = this.getStat("maxHp") ?? "0";
		if (/^\|\|\d+\|\|$/.test(maxHpStat)) maxHpStat = maxHpStat.slice(2, -2);
		const maxHp = +maxHpStat;

		return hpToGauge(hp, maxHp);
	}

	public getStat(key: string): string | null {
		if (/^name$/i.test(key)) {
			return this.name;
		}
		if (/^alias$/i.test(key)) {
			return this.alias ?? null;
		}
		if (/^(aka|n(ick)?name)$/i.test(key)) {
			return this.aka ?? this.name;
		}
		if (/^hpGauge$/i.test(key)) {
			return this.getHpGauge();
		}
		if (/^sheet\.?url$/i.test(key)) {
			let sheetUrl = this.notes.getStat(key)?.note.trim();
			if (sheetUrl === "on") {
				const { sheetRef } = this.pathbuilder ?? { };
				if (sheetRef?.channelId) {
					sheetUrl = toMessageUrl(sheetRef);
				}
			}
			if (isUrl(sheetUrl, { wrapChars:"<>", wrapOptional:true })) {
				if (!isWrapped(sheetUrl, "<>")) {
					sheetUrl = wrap(sheetUrl, "<>");
				}
				return sheetUrl;
			}
			return null;
		}

		const noteStat = this.notes.getStat(key)?.note.trim() ?? undefined;
		if (noteStat !== undefined) {
			return noteStat;
		}

		const fetchedStat = this.fetchedStats?.get(key);
		if (fetchedStat !== undefined) {
			return fetchedStat;
		}

		const pb = this.pathbuilder;
		if (pb) {
			let pbKey = key;
			if (/^explorationMode$/i.test(key)) pbKey = "activeExploration";
			if (/^explorationSkill$/i.test(key)) pbKey = "initskill";
			const pbStat = pb.getStat(pbKey) ?? null;
			if (pbStat !== null) {
				return String(pbStat);
			}
		}

		// provide a temp shortcut for off-guard ac for PF2e
		if (/^ogac$/i.test(key)) {
			const ac = this.getStat("ac");
			if (ac !== null) {
				return doStatMath(`(${ac}-2)`);
			}
		}

		// provide a temp shortcut for cantrip rank for PF2e
		if (/^cantrip\.rank$/i.test(key)) {
			const level = this.getStat("level");
			if (level !== null) {
				const mathed = doStatMath(`(${level})`);
				const rank = Math.ceil(+mathed / 2);
				return String(rank);
			}
		}

		// provide a temp shortcut for dc values for PF2e
		if (/^dc\./i.test(key)) {
			const statKey = key.slice(3);
			const statValue = this.getStat(statKey);
			if (statValue !== null) {
				return doStatMath(`(${statValue}+10)`);
			}
		}

		// provide a temp shortcut for calculating stat modifiers for d20 games
		const abilities = ["strength","dexterity","constitution","intelligence","wisdom","charisma"];
		const keyLower = key.toLowerCase();
		for (const ability of abilities) {
			if (ability.slice(0, 3) === keyLower || `mod.${ability}` === keyLower) {
				const abilityValue = this.getStat(ability);
				if (abilityValue !== null) {
					return doStatMath(`floor((${abilityValue}-10)/2)`);
				}
			}
		}

		if (/^conditions$/i.test(key) && this.gameSystem?.isP20) {
			const conditions: string[] = [];

			Condition.getToggledConditions().forEach(condition => {
				if (this.getStat(condition) !== null) {
					const riders = Condition.getConditionRiders(condition);
					const riderText = riders.length ? ` (${riders.join(", ")})` : ``;
					conditions.push(condition + riderText);
				}
			});

			Condition.getValuedConditions().forEach(condition => {
				const value = this.getStat(condition);
				if (value !== null) {
					conditions.push(`${condition} ${value}`);
				}
			});

			conditions.sort();

			return conditions.join(", ");
		}

		return null;
	}

	public async processStatsAndMods(stats?: TKeyValuePair[], mods?:StatModPair[]): Promise<boolean> {
		let updated = false;
		if (stats?.length) {
			updated = await this.updateStats(stats, false);
		}

		let modded = false;
		if (mods?.length) {
			for (const pair of mods) {
				const oldValue = this.getStat(pair.key) ?? 0;
				const math = `(${oldValue}${pair.modifier}${pair.value})`;
				const newValue = doStatMath(math);
				const updated = await this.updateStats([{ key:pair.key, value:newValue }], false);
				modded ||= updated;
			}
		}

		return updated || modded;
	}

	public async updateStats(pairs: TKeyValuePair[], save: boolean): Promise<boolean> {
		let changes = false;
		const forNotes: TKeyValuePair[] = [];
		const pb = this.pathbuilder;
		for (const pair of pairs) {
			const key = pair.key;
			const value = pair.value ?? "";
			if (/^name$/i.test(key) && value?.trim() && (this.name !== value || (pb && pb.name !== value))) {
				this.name = value;
				if (pb) {
					pb.name = value;
				}
				changes = true;
				continue;
			}

			let correctedKey: string | undefined;
			let correctedValue: string | undefined;
			const isExplorationMode = /^explorationmode$/i.test(key);
			const isExplorationSkill = /^explorationskill$/i.test(key);
			if (isExplorationMode || isExplorationSkill) {
				if (isExplorationMode) {
					correctedKey = "explorationMode";
					correctedValue = getExplorationModes().find(mode => XRegExp(`^${mode.replace(/(\s)/g, "$1?")}$`, "i").test(value));
				}
				if (isExplorationSkill) {
					correctedKey = "explorationSkill";
					correctedValue = getSkills().find(skill => XRegExp(`^${skill.replace(/(\s)/g, "$1?")}$`, "i").test(value));
				}
			}
			if (pb) {
				if (/^level$/i.test(key) && +value) {
					const updatedLevel = await pb.setLevel(+value, save);
					if (updatedLevel) {
						const unset = this.notes.setStat("level", "");
						if (unset) changes = true;
					}
					continue;
				}
				if (isExplorationMode) {
					pb.setSheetValue("activeExploration", correctedValue ?? "Other");
					const unset = this.notes.setStat(correctedKey ?? key, "");
					if (unset) changes = true;
					continue;
				}
				if (isExplorationSkill) {
					pb.setSheetValue("activeSkill", correctedValue ?? "Perception");
					const unset = this.notes.setStat(correctedKey ?? key, "");
					if (unset) changes = true;
					continue;
				}
				// abilities?
				// proficiencies?
			}
			forNotes.push({ key:correctedKey??key, value:correctedValue??value });
		}

		// iterate the stat pairs to double check bounds
		forNotes.forEach(pair => pair.value = checkStatBounds(this, pair) ?? pair.value);

		const updatedNotes = this.notes.updateStats(forNotes);
		return changes || updatedNotes;
	}

	public async update({ alias, avatarUrl, embedColor, name, pathbuilder, pathbuilderId, tokenUrl, userDid }: Args<GameCharacterCore>, save = true): Promise<boolean> {
		// we only use the values that are changable, leaving the needed arrays intact
		let changed = applyChanges(this.core, { alias, avatarUrl, embedColor, pathbuilder, pathbuilderId, tokenUrl, userDid });

		// name is tricky cause we can update via alias in name field; do it separate
		if (name) {
			// we don't wanna edit the name if we are simply using the alias to update
			const notAlias = this.aliasForMatching !== GameCharacter.prepareForMatching(name);
			// if the name and alias are the same then we can update the name
			const aliasMatchesName = this.nameForMatching === this.aliasForMatching;
			if (notAlias || aliasMatchesName) {
				this.name = name;
				changed = true;
			}
		}

		if (changed) {
			delete this._aliasForMatching;
			delete this._nameForMatching;
			delete this._pathbuilder;
			if (save) {
				return this.save();
			}
		}
		return false;
	}

	//#region IHasSave
	public async save(savePathbuilder?: boolean): Promise<boolean> {
		const ownerSaved = await this.owner?.save() ?? false;
		if (savePathbuilder && this.pathbuilderId) {
			const pathbuilderSaved = await this.pathbuilder?.save() ?? false;
			return ownerSaved && pathbuilderSaved;
		}
		return ownerSaved;
	}
	//#endregion

	public static readonly defaultGmCharacterName = DEFAULT_GM_CHARACTER_NAME;

	public static prepareForMatching(name: string): string {
		return XRegExp.replace(name ?? "", XRegExp("[^\\pL\\pN]+"), "", "all").toLowerCase();
	}

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

