import { DEFAULT_GM_CHARACTER_NAME, parseGameSystem, type DialogPostType, type GameSystem } from "@rsc-sage/types";
import { Currency, CurrencyPf2e, type DenominationsCore } from "@rsc-utils/character-utils";
import { applyChanges, Color, getDataRoot, isDefined, isNotBlank, isString, numberOrUndefined, sortByKey, stringArrayOrEmpty, StringMatcher, stringOrUndefined, StringSet, wrap, type Args, type HexColorString, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { doStatMath, processMath, StatBlockProcessor, unpipe, type StatNumbersOptions, type StatNumbersResults, type StatResults } from "@rsc-utils/dice-utils";
import { DiscordKey, toMessageUrl, urlOrUndefined } from "@rsc-utils/discord-utils";
import { fileExistsSync, isUrl, readJsonFile, writeFile } from "@rsc-utils/io-utils";
import { mkdirSync } from "fs";
import { Condition } from "../../../gameSystems/Condition.js";
import { checkStatBounds } from "../../../gameSystems/checkStatBounds.js";
import { Ability } from "../../../gameSystems/d20/lib/Ability.js";
import type { TPathbuilderCharacterMoney } from "../../../gameSystems/p20/import/pathbuilder-2e/types.js";
import { processSimpleSheet } from "../../../gameSystems/processSimpleSheet.js";
import { HephaistosCharacterSF1e } from "../../../gameSystems/sf1e/characters/HephaistosCharacter.js";
import type { HephaistosCharacterCoreSF1e } from "../../../gameSystems/sf1e/import/types.js";
import { getExplorationModes, getSkills, toModifier } from "../../../sage-pf2e/index.js";
import { PathbuilderCharacter, type TPathbuilderCharacter } from "../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { Deck, type DeckCore, type DeckType } from "../../../sage-utils/utils/GameUtils/deck/index.js";
import type { StatModPair } from "../commands/admin/GameCharacter/getCharacterArgs.js";
import { loadCharacterCore, loadCharacterSync, type TEssence20Character, type TEssence20CharacterCore } from "../commands/e20.js";
import { SageMessageReference, type SageMessageReferenceCore } from "../repo/SageMessageReference.js";
import { CharacterManager } from "./CharacterManager.js";
import type { MacroBase } from "./Macro.js";
import { NoteManager, type TNote } from "./NoteManager.js";
import type { TKeyValuePair } from "./SageMessageArgs.js";
import { toTrackerBar, toTrackerDots } from "./utils/ValueBars.js";
import { getMetaStat } from "./utils/getMetaStat.js";
import { getStatNumbers } from "./utils/getStatNumbers.js";
import { processCharStatsAndMods } from "./utils/processCharStatsAndMods.js";

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

const MatchSpaceRegExp = /(\s)/g;

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
	lastMessages?: (SageMessageReference | SageMessageReferenceCore)[];
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
	hephaistos?: HephaistosCharacterCoreSF1e;
	hephaistosId?: string;
	/** The image used to represent the character to the left of the post */
	tokenUrl?: string;
	/** The character's user's Discord ID */
	userDid?: Snowflake;
};

// 		export type TPlayerCharacterImageType = "Default"
// 												| "Token" | "TokenBloody" | "TokenDying"
// 												| "Profile" | "ProfileBloody" | "ProfileDying"
// 												| "Full" | "FullBloody" | "FullDying";

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
	core.lastMessages = core.lastMessages?.map((lm: SageMessageReferenceCore | { core:SageMessageReferenceCore }) => {
		while("core" in lm) {
			lm = lm.core;
		}
		return lm;
	});
}

//#endregion

export class GameCharacter {
	public equals(other: Optional<string | GameCharacter>): boolean {
		if (!other) return false;
		if (other instanceof GameCharacter) return other.id === this.core.id;
		return this.core.id === other;
	}

	public constructor(private core: GameCharacterCore, protected owner?: CharacterManager) {
		updateCore(core);

		const companionType = this.isPcOrCompanion ? "companion" : "minion";
		this.core.companions = CharacterManager.from(this.core.companions as GameCharacterCore[] ?? [], this, companionType);
		this.core.lastMessages = this.core.lastMessages?.map(SageMessageReference.fromCore) ?? [];

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
	public get lastMessages(): SageMessageReference[] { return this.core.lastMessages as SageMessageReference[]; }

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

	private _hephaistos: HephaistosCharacterSF1e | null | undefined;
	public get hephaistos(): HephaistosCharacterSF1e | null {
		if (this._hephaistos === undefined) {
			if (this.core.hephaistos) {
				this._hephaistos = new HephaistosCharacterSF1e(this.core.hephaistos);
			}
			if (this.core.hephaistosId) {
				this._hephaistos = HephaistosCharacterSF1e.loadCharacterSync(this.core.hephaistosId) ?? null;
			}
		}
		return this._hephaistos ?? null;
	}

	/** @todo figure out what this id is and what it represents */
	public get hephaistosId(): string | undefined { return this.core.hephaistosId; }
	public set hephaistosId(hephaistosId: Optional<string>) { this.core.hephaistosId = hephaistosId ?? undefined; }

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
	public get userId(): Snowflake | undefined { return this.core.userDid; }
	/** @deprecated use .userId */
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
	// public getLastMessage(channelId: Snowflake): SageMessageReference | undefined {
	// 	return this.lastMessages.find(dm => dm.matchesChannel(channelId));
	// }

	/** Returns the last dialog messages for this character and all its companions in the given channel. */
	// public getLastMessages(channelId: Snowflake): SageMessageReference[] {
	// 	const dialogMessages: SageMessageReference[] = [];

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
	public setLastMessage(dialogMessage: SageMessageReference): void {
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

	public toDisplayName({ processor, overrideTemplate, raw }: { overrideTemplate?: string; processor?:StatBlockProcessor; raw?:boolean; } = { }): string {
		const templatedValue = StatBlockProcessor.processTemplate({ char:this, processor, overrideTemplate, templateKey:"displayName", templatesOnly:raw });
		if (templatedValue) {
			return templatedValue;
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
		if (this.getString("nameDescriptors.template")?.toLowerCase() === "off") return [];
		const templatedValue = StatBlockProcessor.for(this).processTemplate("nameDescriptors").value;
		if (templatedValue) {
			return templatedValue
				.split(",")
				.filter(isNotBlank)
				.map(s => s.trim());
		}

		const descriptors: string[] = [];
		const push = (value: Optional<string>) => {
			if (isNotBlank(value)) descriptors.push(value.trim());
		};

		if (this.isPcOrCompanion) {
			// ancestry (heritage)
			push(this.getString("aDescriptor", "ancestry", "hDescriptor", "heritage"));

			// class/dualClass level
			const cDescriptor = this.getString("cDescriptor");
			if (cDescriptor) {
				push(cDescriptor);

			}else {
				const classes = stringOrUndefined(
					[this.getString("class"), this.getString("dualClass")]
						.filter(isNotBlank)
						.map(s => s.trim())
						.join("/")
				);
				const level = this.getNumber("level")?.toString();
				if (classes && level) {
					push(`${classes} ${level}`);
				}else {
					push(classes);
				}
			}

		}else {
			// generic descriptor
			push(this.getString("descriptor"));

			// gender
			push(this.getString("gDescriptor", "gender"));

			// ancestry / heritage
			push(this.getString("aDescriptor", "ancestry", "hDescriptor", "heritage"));

			// background / class
			push(this.getString("bDescriptor", "background", "cDescriptor", "class"));
		}

		return descriptors;
	}

	public toSheetLink(): string | undefined {
		return this.getString("sheet.link");
	}

	public toDialogFooterLine({ processor, overrideTemplate }: { processor?:StatBlockProcessor; overrideTemplate?: string; } = { }): string | undefined {
		const dialogFooter = StatBlockProcessor.processTemplate({ char:this, processor, overrideTemplate, templateKey:"dialogFooter" });
		return dialogFooter;
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

	public get gameSystem(): GameSystem | undefined {
		const gameSystem = parseGameSystem(this.getNoteStat("gameSystem"))
			?? this.owner?.gameSystem;

		// if they explicitly set None, honor it
		if (gameSystem?.type === 0) return gameSystem;

		// ensure a pathbuilder import uses a p20 system
		if (this.pathbuilder) {
			if (gameSystem?.isP20) {
				return gameSystem;
			}
			/** @todo check for sf2e */
			return parseGameSystem("PF2E");
		}

		// ensure a hephaistos import uses sf1e
		if (this.hephaistos) {
			return parseGameSystem("SF1E")
		}

		// ensure an essence20 import uses a e20 system
		if (this.essence20) {
			if (gameSystem?.code === "E20") {
				return gameSystem;
			}
			return parseGameSystem("e20");
		}

		return gameSystem;
	}

	public get hasStats(): boolean {
		return this.getNoteStats().length > 0
			|| !!this.pathbuilder
			|| !!this.hephaistos
			|| !!this.essence20;
	}

	public toStatsOutput(options?: { custom?:boolean; processor?:StatBlockProcessor, raw?:boolean; simple?:boolean; stats?:boolean; templates?:boolean; }) {
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
				lines: templateStats.map(note => `<b>${note.title}</b> \`\`\`${note.note}\`\`\``)
			};
		};

		const processor = options?.processor ?? StatBlockProcessor.for(this);

		const sections = ["simple","custom","stats","templates"] as const;
		const isSection = (value: string): value is typeof sections[number] => sections.includes(value as any);
		const explicitSections = options?.simple || options?.custom || options?.stats || options?.templates;
		const defaultSections = !explicitSections ? this.getStringArray("details.defaultSections", { lower:true }).filter(isSection) : [];
		const showSection = (section: typeof sections[number]) => explicitSections ? options[section] : !defaultSections?.length ? true : defaultSections.includes(section);

		const raw = options?.raw;

		const showSimple = showSection("simple");
		const { keys: simpleKeys = [], title: simpleTitle, lines: simpleLines = [] } = showSimple ? processSimpleSheet({ char:this, processor }) : {};

		const showCustom = showSection("custom");
		const { keys: customKeys = [], title: customTitle, lines: customLines = [] } = showCustom ? processor.processTemplate("customSheet", raw ? { templatesOnly:true } : undefined) : {};

		const showTemplates = showSection("templates");
		const { keys: templateKeys = [], title: templateTitle, lines: templateLines = [] } = showTemplates ? processTemplateKeys() : {};

		const usedKeys = new Set<Lowercase<string>>([...simpleKeys, ...customKeys, ...templateKeys]);

		const showStats = showSection("stats");
		if (!showStats) {
			return [
				{ title: simpleTitle, lines: simpleLines },
				{ title: customTitle, lines: customLines },
				{ title: templateTitle, lines: templateLines },
			];
		}

		// remove keys used in simple sheet, custom sheet, or template stats; always remove templates
		statsToMap = statsToMap.filter(({ title }) => {
			const lower = title.toLowerCase();
			return !usedKeys.has(lower) && !lower.endsWith(".template") && !lower.endsWith(".template.title");
		});
		statsToMap.sort(sorter);

		const otherTitle = simpleLines.length || customLines.length ? `Other Stats` : `Stats`;
		const otherLines = statsToMap.map(({ title, note }) => {
			const value = raw || isUrl(note) ? note : processMath(processor.processStatBlocks(note));
			return `<b>${title}</b> ${value}`;
		});

		return [
			{ title: simpleTitle, lines: simpleLines },
			{ title: customTitle, lines: customLines },
			{ title: otherTitle, lines: otherLines },
			{ title: templateTitle, lines: templateLines },
		];
	}

	public getTrackerBar(key: string): string {
		const { val, max } = this.getNumbers(key, { val:true, max:true });
		const barValues = this.getString(`${key}.bar.values`);
		return toTrackerBar(val, max, barValues);
	}

	public hasTrackerBar(key: string): boolean {
		return this.getString(`${key}.bar.values`) !== undefined;
	}

	public getTrackerDots(key: string): string {
		const { val, max } = this.getNumbers(key, { val:true, max:true });
		const dotValues = this.getString(`${key}.dots.values`);
		return toTrackerDots(val, max, dotValues);
	}

	public hasTrackerDots(key: string): boolean {
		return this.getString(`${key}.dots.values`) !== undefined;
	}

	public hasIndexedValues(key: string): boolean {
		return this.getString(`${key}.indexed.values`) !== undefined;
	}

	/** returns the value for the first key that has a defined value */
	public getNumber(...keys: string[]): number | undefined {
		for (const key of keys) {
			const stat = this.getStat(key, true);
			if (stat.isDefined) {
				return stat.hasPipes
					? numberOrUndefined(stat.unpiped)
					: numberOrUndefined(stat.value);
			}
		}
		return undefined;
	}

	/**
	 * Gets the value and meta data for the meta keys as numbers.
	 * For each meta key: .xKey, .x, .xDefined, and .xPipes are returned.
	 * .hasPipes and .isEmpty are also included as tests against all meta keys.
	 * If no meta keys are specified, then all meta keys are returned.
	 */
	public getNumbers(key: string, opts?: StatNumbersOptions): StatNumbersResults {
		return getStatNumbers({ char:this, key, ...opts });
	}

	/** returns the value for the first key that has a defined value */
	public getString(...keys: string[]): string | undefined {
		for (const key of keys) {
			const stat = this.getStat(key, true);
			if (stat.isDefined) {
				return String(stat.value);
			}
		}
		return undefined;
	}

	/** Convenience for: .getString(key)?.split(",").map(stringOrUndefined).filter(isDefined) ?? [] */
	public getStringArray(key: string, opts?: { lower?:boolean; }): string[] {
		const value = this.getString(key);
		return stringArrayOrEmpty(opts?.lower ? value?.toLowerCase() : value);
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
		const ret = (casedKey = key, value: Optional<number | string> = null): StatResults<string> | string | null => {
			const _isDefined = isDefined(value);
			const _value = _isDefined && !isString(value) ? String(value) : value ?? null;
			if (includeKey) {
				const unpiped = _isDefined ? unpipe(_value!) : undefined;
				return { isDefined:_isDefined, key:casedKey, keyLower, value:_value, ...unpiped } as StatResults<string>;
			}
			return _value;
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

		//#region tracker bars

		const isDeprecatedHpBar = ["hpgauge", "hpbar"].includes(keyLower);
		if (keyLower.endsWith(".bar") || isDeprecatedHpBar) {
			const statKey = isDeprecatedHpBar ? this.getKey("hitPoints") : keyLower.slice(0, -4);
			const { val, max } = this.getNumbers(statKey);
			if (val !== undefined || max !== undefined) {
				/** @todo do i wanna try to case this key? */
				return ret(key, this.getTrackerBar(statKey));
			}
		}

		if (keyLower.endsWith(".dots")) {
			const statKey = keyLower.slice(0, -5);
			if (this.getNumber(statKey) !== undefined) {
				return ret(key, this.getTrackerDots(statKey));
			}
		}

		if (keyLower.endsWith(".indexed")) {
			const statKey = keyLower.slice(0, -8);
			const value = this.getNumber(statKey);
			if (value !== undefined) {
				const valuesString = this.getString(`${statKey}.indexed.values`);
				const values = valuesString?.split(",").map(s => s.trim()) ?? [];
				return ret(key, values[value!] ?? "?");
			}
		}

		// shim for initial offering
		if (keyLower === "hp.bar.values") {
			return ret(key, this.getNoteStat(key, "hpbar.values"));
		}

		//#endregion

		// enforce sheet.url and stop using sheeturl
		if (keyLower === "sheet.url" || keyLower === "sheeturl") {
			let sheetUrl = this.getNoteStat("sheet.url", "sheeturl");
			if (sheetUrl === "on") {
				const { sheetRef } = this.essence20 ?? this.pathbuilder ?? this.hephaistos ?? { };
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
				const mathedValue = doStatMath(statValue);
				const numberValue = numberOrUndefined(mathedValue);
				if (numberValue === undefined) {
					return ret(retKey, `isNaN(${statValue})`);
				}
				const fn = halfUp ? Math.ceil : Math.floor;
				return ret(retKey, fn(numberValue / 2));
			}
		}

		if (keyLower.startsWith("signed.")) {
			const statKey = key.slice(7);
			const { key:casedKey, value:statValue } = this.getStat(statKey, true);
			if (statValue) {
				const retKey = `signed.${casedKey}`;
				const mathed = processMath(statValue, { allowSpoilers:true });
				const numberValue = numberOrUndefined(mathed);
				if (numberValue === undefined) {
					return ret(retKey, `signed(${statValue})`);
				}
				const signed = toModifier(numberValue);
				return ret(retKey, signed);
			}
		}

		//#endregion

		// get custom stat added via message posts
		const noteStat = this.getNoteKeyAndStat(key);
		if (noteStat !== undefined) {
			return ret(noteStat.key, noteStat.value);
		}

		// get stats from underlying e20 character
		const { essence20 } = this;
		if (essence20) {
			const e20Stat = essence20.getStat(key, keyLower);
			if (e20Stat.isDefined) {
				return ret(e20Stat.key, String(e20Stat.value));
			}
		}

		const { hephaistos } = this;
		// if (hephaistos) {
		// 	const hephStat = hephaistos.getStat(key, keyLower);
		// 	if (hephaistos.isDefined) {
		// 		return ret(hephStat.key, String(hephStat.value));
		// 	}
		// }

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

		for (const ability of Ability.all()) {
			const isAbbr = ability.abbrKey === keyLower;
			if (isAbbr || `mod.${ability}` === keyLower) {
				// just use getNumber ...
				const abilityValue = this.getString(ability.key);
				if (isDefined(abilityValue)) {
					const retKey = isAbbr ? ability.abbr : `mod.${ability.name}`;
					return ret(retKey, processMath(`floor((${abilityValue}-10)/2)`, { allowSpoilers:true }));
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
		const hpKey = this.getKey("hitPoints");
		if (keyLower === hpKey.toLowerCase()) {
			return ret("hp", getMetaStat(this, hpKey, "max").value);
		}

		// instead of importing each Condition class and running them in their getStatXXX, let's just use a single entry point for Condition
		if (keyLower === "conditions") {
			return ret(keyLower, Condition.getCharacterConditions(this));
		}

		const { gameSystem } = this;
		if (pathbuilder || gameSystem?.isP20) {
			const p20Stat = this.getStatP20(key, keyLower);
			return ret(p20Stat.key, p20Stat.value);
		}

		if (hephaistos || gameSystem?.code === "SF1e") {
			const sf1eStat = this.getStatSF1e(key, keyLower);
			return ret(sf1eStat.key, sf1eStat.value);
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

		return ret();
	}

	protected getStatSF1e(key: string, keyLower = key.toLowerCase() as Lowercase<string>): StatResults<string | number, undefined> {
		// return value creator
		const ret = (casedKey = key, value: Optional<number | string> = undefined) => (
			{ isDefined:isDefined(value), key:casedKey, keyLower, value:value??undefined } as StatResults<string | number, undefined>
		);

		// provide a shortcut for flat-footed ac
		if (keyLower === "ffac") {
			const acStat = this.getStat("ac", true);
			if (acStat.isDefined) {
				return ret(keyLower, doStatMath(`(${acStat.value}-2)`));
			}
		}

		return ret();
	}

	/** Convenient way of getting the displayName.template stat */
	public getTemplate(baseKey: string): string | undefined { return this.getNoteStat(`${baseKey}.template`); }
	public setTemplate(baseKey: string, template?: string): boolean { return this.notes.setStat(`${baseKey}.template`, template ?? ""); }

	public getCurrency() {
		// try getting currency from gameSystem
		let currency = Currency.new<CurrencyPf2e>(this.gameSystem?.code);

		// otherwise see if we are SF2e
		if (!currency && (this.getNumber("credits") || this.getNumber("upbs"))) {
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

	/** This allows Sage to have a set key for things but users can re-key their stats. */
	private keyMap?: Map<string, string[]>;
	/**
	 * @todo This code currently requires parsing the keys every time we load the character.
	 * If they use multiple key options, it means testing the values every time we fetch the key.
	 * If we instead store the map as a map/object/record, we will only need to recreate it when they update this key map.
	 * If we also store wether each mapped key is defined, then we would only need to check if it is defined when they update stats.
	 * Thus the proposed solution would be:
	 *   1. move the key mapping logic to "setKeyMap"
	 *   2. move the isDefined test to "updateStats"
	 *   3. update the getKey logic simply read the map and return the first key with isDefined === true
	 * This solution should also be implemented on CharacterShell, or in a reusable fashion.
	 */
	public getKey(key: "hitPoints" | "staminaPoints"): string {
		// initialize the map
		if (!this.keyMap) {
			// split the key/value pairs
			const pairs = this.getNoteStat("char.stat.key.map")?.split(";") ?? [];

			// include built in pairs
			pairs.unshift("hitPoints=hp");

			// create the map
			this.keyMap = pairs.reduce((map, pair) => {
				// split pair by "=": key=value
				const [pairKey, pairValue] = pair.split("=");

				// split value into values by ",": map each value to a trimmed string, filter out blank
				const values = pairValue.split(",").map(s => stringOrUndefined(s.trim())).filter(isDefined);

				// only add the key if we actually have value(s)
				if (values.length) {
					// trim the key in case they had extra spaces
					map.set(pairKey.trim().toLowerCase(), values);
				}
				return map;
			}, new Map<string, string[]>());
		}

		// get the mapped key(s)
		const keys = this.keyMap.get(key.toLowerCase());

		// if we have any mapped key(s), do not use the default
		if (keys?.length) {
			// if we have more than one, return the first to be defined
			if (keys.length > 1) {
				for (const _key of keys) {
					if (this.getStat(_key, true).isDefined) {
						return _key;
					}
				}
			}

			// default to the first
			return keys[0];
		}

		// use the default
		return key;
	}

	public async processStatsAndMods(stats?: TKeyValuePair[], mods?:StatModPair[]): Promise<StringSet> {
		return processCharStatsAndMods(this, stats, mods);
	}

	/** returns keys (lowercased) updated */
	public async updateStats(pairs: TKeyValuePair[], save: boolean): Promise<StringSet> {
		const keysUpdated = new StringSet();

		const forNotes: TKeyValuePair[] = [];
		const { gameSystem, pathbuilder:p20, hephaistos:h1e, essence20:e20 } = this;
		for (const { key, value:valueOrNull } of pairs) {
			const keyLower = key.toLowerCase();

			const value = valueOrNull ?? "";
			if (
				keyLower === "name"
				&& value.trim()
				&& (
					this.name !== value
					|| (p20 && p20.name !== value)
					|| (h1e && h1e.name !== value)
					|| (e20 && e20.name !== value)
					)
				) {
				this.name = value;
				if (p20) p20.name = value;
				if (h1e) h1e.name = value;
				if (e20) e20.name = value;
				keysUpdated.add(keyLower);
				continue;
			}

			let correctedKey: string | undefined;
			let correctedValue: string | undefined;
			const isExplorationMode = keyLower === "explorationmode";
			const isExplorationSkill = keyLower === "explorationskill";
			if (isExplorationMode || isExplorationSkill) {
				const matchValue = (val: string) => new RegExp(`^${val.replace(MatchSpaceRegExp, "$1?")}$`, "i").test(value);
				if (isExplorationMode) {
					correctedKey = "explorationMode";
					correctedValue = getExplorationModes().find(matchValue);
				}
				if (isExplorationSkill) {
					correctedKey = "explorationSkill";
					correctedValue = getSkills().find(matchValue);
				}
			}

			/** @todo duplicate some of the following for h1e */
			if (p20) {
				if (keyLower === "level" && +value) {
					const updatedLevel = await p20.setLevel(+value, save);
					if (updatedLevel) {
						this.notes.setStat("level", "");
						keysUpdated.add(keyLower);
					}
					continue;
				}

				if (Currency.isDenominationKey(gameSystem, keyLower)) {
					const money = { } as TPathbuilderCharacterMoney;
					money[keyLower as keyof TPathbuilderCharacterMoney] = +value;
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
			if (this.hephaistosId) {
				return await this.hephaistos?.save() ?? false;
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

