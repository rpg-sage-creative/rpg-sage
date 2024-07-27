import { DEFAULT_GM_CHARACTER_NAME, type DialogPostType } from "@rsc-sage/types";
import { Color, type HexColorString } from "@rsc-utils/color-utils";
import { NIL_SNOWFLAKE, applyChanges, isNonNilSnowflake, type Args, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordKey } from "@rsc-utils/discord-utils";
import XRegExp from "xregexp";
import { PathbuilderCharacter, getExplorationModes, getSkills, type TPathbuilderCharacter } from "../../../sage-pf2e/index.js";
import { doStatMath } from "../commands/dice/stats/doStatMath.js";
import { CharacterManager } from "./CharacterManager.js";
import type { IHasSave } from "./NamedCollection.js";
import { NoteManager, type TNote } from "./NoteManager.js";
import type { TKeyValuePair } from "./SageMessageArgs.js";

export type TDialogMessage = {
	channelDid: Snowflake;
	characterId: Snowflake;
	gameId: Snowflake;
	messageDid: Snowflake;
	serverDid: Snowflake;
	threadDid: Snowflake;
	timestamp: number;
	userDid: Snowflake;
};
export type TGameCharacterType = "gm" | "npc" | "pc" | "companion" | "minion";
type AutoChannelData = {
	channelDid: Snowflake;
	dialogPostType?: DialogPostType;
	userDid?: Snowflake;
};
export interface GameCharacterCore {
	/** short name used to ease dialog access */
	alias?: string;
	/** Channels to automatically treat input as dialog */
	autoChannels?: AutoChannelData[];
	/** The image used for the right side of the dialog */
	avatarUrl?: string;
	/** The character's companion characters */
	companions?: (GameCharacter | GameCharacterCore)[];
	/** Discord compatible color: #001122 */
	embedColor?: HexColorString;
	/** Unique ID of this character */
	id: Snowflake;
	/** A list of the character's last messages by channel. */
	lastMessages?: TDialogMessage[];
	/** The character's name */
	name: string;
	/** The character's notes (stats & journal too) */
	notes?: TNote[];
	/** The character's Pathbuilder build. */
	pathbuilder?: TPathbuilderCharacter;
	pathbuilderId?: string;
	/** The image used to represent the character to the left of the post */
	tokenUrl?: string;
	/** The character's user's Discord ID */
	userDid?: Snowflake;
}
// 		export type TPlayerCharacterImageType = "Default"
// 												| "Token" | "TokenBloody" | "TokenDying"
// 												| "Profile" | "ProfileBloody" | "ProfileDying"
// 												| "Full" | "FullBloody" | "FullDying";

/** Determine if the snowflakes are different. */
function diff(a?: Snowflake, b?: Snowflake) {
	return (a ?? NIL_SNOWFLAKE) !== (b ?? NIL_SNOWFLAKE);
}

/** Temp convenience function to get a DiscordKey from varying input */
export function toDiscordKey(channelDidOrDiscordKey: DiscordKey | Snowflake, threadDid?: Snowflake): DiscordKey {
	if (channelDidOrDiscordKey instanceof DiscordKey) {
		return channelDidOrDiscordKey;
	}
	return new DiscordKey(null, channelDidOrDiscordKey, threadDid);
}
function keyMatchesMessage(discordKey: DiscordKey, dialogMessage: TDialogMessage): boolean {
	const { channel, thread } = discordKey.channelAndThread;
	const hasThread = isNonNilSnowflake(dialogMessage.threadDid);
	if (hasThread) {
		return dialogMessage.channelDid === channel
			&& dialogMessage.threadDid === thread;
	}
	if (thread) {
		return dialogMessage.channelDid === thread;
	}
	return dialogMessage.channelDid === channel;
}

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
	return core as GameCharacterCore;
}

//#endregion

export class GameCharacter implements IHasSave {
	public constructor(private core: GameCharacterCore, protected owner?: CharacterManager) {
		updateCore(core);

		this.isGM = this.type === "gm";
		this.isNPC = this.type === "npc";
		this.isMinion = this.type === "minion";
		this.isGMorNPC = this.isGM || this.isNPC;
		this.isGMorNPCorMinion = this.isGM || this.isNPC || this.isMinion;

		this.isCompanion = this.type === "companion";
		this.isPC = this.type === "pc";
		this.isPCorCompanion = this.isPC || this.isCompanion;

		this.isCompanionOrMinion = this.isCompanion || this.isMinion;

		const companionType = this.isPCorCompanion ? "companion" : "minion";
		this.core.companions = CharacterManager.from(this.core.companions as GameCharacterCore[] ?? [], this, companionType);

		this.notes = new NoteManager(this.core.notes ?? (this.core.notes = []), this.owner);
	}

	/** short name used to ease dialog access */
	public get alias(): string | undefined { return this.core.alias; }
	public set alias(alias: string | undefined) { this.core.alias = alias; }

	/** Channels to automatically treat input as dialog */
	public get autoChannels(): AutoChannelData[] { return this.core.autoChannels ?? (this.core.autoChannels = []); }

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

	public isGM: boolean;// = this.type === "gm"
	public isNPC: boolean;// = this.type === "npc";
	public isMinion: boolean;
	public isGMorNPC: boolean;// = this.isGM || this.isNPC;
	public isGMorNPCorMinion: boolean;
	public isPC: boolean;// = this.type === "pc";
	public isCompanion: boolean;// = this.type === "companion";
	public isPCorCompanion: boolean;// = this.isPC || this.isCompanion;
	public isCompanionOrMinion: boolean;

	/** A list of the character's last messages by channel. */
	public get lastMessages(): TDialogMessage[] {
		return this.core.lastMessages ?? (this.core.lastMessages = []);
	}

	/** The character's name */
	public get name(): string { return this.core.name; }
	public set name(name: string) { this.core.name = name; }

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

	private _preparedAlias?: string;
	private get preparedAlias(): string { return this._preparedAlias ?? (this._preparedAlias = GameCharacter.prepareName(this.alias ?? this.name)); }
	private _preparedName?: string;
	private get preparedName(): string { return this._preparedName ?? (this._preparedName = GameCharacter.prepareName(this.name)); }

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

	public getLastMessage(discordKey: DiscordKey): TDialogMessage | undefined {
		return this.lastMessages.find(dm => keyMatchesMessage(discordKey, dm));
	}

	public getLastMessages(discordKey: DiscordKey): TDialogMessage[] {
		const dialogMessages: TDialogMessage[] = [];
		const lastMessage = this.getLastMessage(discordKey);
		if (lastMessage) {
			dialogMessages.push(lastMessage);
		}
		this.companions.forEach(companion => {
			dialogMessages.push(...companion.getLastMessages(discordKey));
		});
		// lastMessages.sort((a, b) => a.timestamp - b.timestamp);
		return dialogMessages;
	}

	public setLastMessage(dialogMessage: TDialogMessage): void {
		const newHasThread = diff(dialogMessage.threadDid);
		const lastMessages = this.lastMessages;
		const filtered = lastMessages.filter(dMessage => {
			if (diff(dMessage.serverDid, dialogMessage.serverDid)) {
				return true;
			}
			const thisHasThread = diff(dMessage.threadDid);
			if (newHasThread && thisHasThread) {
				return diff(dialogMessage.threadDid, dMessage.threadDid);
			}else if (thisHasThread) {
				return true;
			}else if (newHasThread) {
				return diff(dialogMessage.threadDid, dMessage.channelDid);
			}
			return diff(dialogMessage.channelDid, dMessage.channelDid);
		});

		lastMessages.length = 0;
		lastMessages.push(...filtered);
		lastMessages.push(dialogMessage);
	}

	//#endregion

	/** Compares name literal, alias literal, then preparedName. If recursive, it also checks companions. */
	public matches(name: string, recursive = false): boolean {
		if (this.name === name || this.alias === name) {
			return true;
		}
		const preparedName = GameCharacter.prepareName(name);
		if (this.preparedName === preparedName || this.preparedAlias === preparedName) {
			return true;
		}
		return recursive && this.companions.hasMatching(name, true);
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

	public get pathbuilderId(): string | undefined { return this.core.pathbuilderId; }
	public set pathbuilderId(pathbuilderId: Optional<string>) { this.core.pathbuilderId = pathbuilderId ?? undefined; }

	private _pathbuilder: PathbuilderCharacter | null | undefined;
	public get pathbuilder(): PathbuilderCharacter | null {
		if (this._pathbuilder === undefined) {
			if (this.core.pathbuilder) {
				this._pathbuilder = new PathbuilderCharacter(this.core.pathbuilder);
			}
			if (this.core.pathbuilderId) {
				this._pathbuilder = PathbuilderCharacter.loadCharacterSync(this.core.pathbuilderId);
			}
		}
		return this._pathbuilder ?? null;
	}

	public getStat(key: string): string | null {
		if (/^name$/i.test(key)) {
			return this.name;
		}
		if (/^alias$/i.test(key)) {
			return this.alias ?? null;
		}
		if (/^nname$/i.test(key)) {
			return this.notes.getStat("nickname")?.note.trim() ?? this.name;
		}

		const noteStat = this.notes.getStat(key)?.note.trim() ?? null;
		if (noteStat !== null) {
			return noteStat;
		}

		const pb = this.pathbuilder;
		if (pb) {
			let pbKey = key;
			if (/^explorationmode$/i.test(key)) pbKey = "activeExploration";
			if (/^explorationskill$/i.test(key)) pbKey = "initskill";
			const pbStat = pb.getStat(pbKey) ?? null;
			if (pbStat !== null) {
				return String(pbStat);
			}
		}

		// provide a temp shortcut for off-guard ac for PF2e
		if (/^ogac$/i.test(key)) {
			const ac = this.getStat("ac");
			if (ac !== null) {
				return doStatMath(ac + "-2");
			}
		}

		// provide a temp shortcut for cantrip rank for PF2e
		if (/^cantrip\.rank$/i.test(key)) {
			const level = this.getStat("level");
			if (level !== null) {
				const mathed = doStatMath(level);
				const rank = Math.ceil(+mathed / 2);
				return String(rank);
			}
		}

		return null;
	}
	public async updateStats(pairs: TKeyValuePair[], save: boolean): Promise<boolean> {
		let changes = false;
		const forNotes: TKeyValuePair[] = [];
		const pb = this.pathbuilder;
		for (const pair of pairs) {
			const { key, value } = pair;
			if (/^name$/i.test(key) && value?.trim() && (this.name !== value || (pb && pb.name !== value))) {
				this.name = value;
				if (pb) {
					pb.name = value;
				}
				changes ||= true;
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
						this.notes.unsetStats("level");
					}
					changes ||= updatedLevel;
					continue;
				}
				if (isExplorationMode) {
					pb.setSheetValue("activeExploration", correctedValue ?? "Other");
					this.notes.unsetStats(correctedKey ?? key);
					continue;
				}
				if (isExplorationSkill) {
					pb.setSheetValue("activeSkill", correctedValue ?? "Perception");
					this.notes.unsetStats(correctedKey ?? key);
					continue;
				}
				// abilities?
				// proficiencies?
			}
			forNotes.push({ key:correctedKey??key, value:correctedValue??value });
		}
		const updatedNotes = await this.notes.updateStats(forNotes, save);
		return changes || updatedNotes;
	}

	public async update({ alias, avatarUrl, embedColor, name, pathbuilder, pathbuilderId, tokenUrl, userDid }: Args<GameCharacterCore>, save = true): Promise<boolean> {
		// we only use the values that are changable, leaving the needed arrays intact
		let changed = applyChanges(this.core, { alias, avatarUrl, embedColor, pathbuilder, pathbuilderId, tokenUrl, userDid });

		// name is tricky cause we can update via alias in name field; do it separate
		if (name) {
			// we don't wanna edit the name if we are simply using the alias to update
			const notAlias = this.preparedAlias !== GameCharacter.prepareName(name);
			// if the name and alias are the same then we can update the name
			const aliasMatchesName = this.preparedName === this.preparedAlias;
			if (notAlias || aliasMatchesName) {
				this.name = name;
				changed = true;
			}
		}

		if (changed) {
			delete this._preparedAlias;
			delete this._preparedName;
			delete this._pathbuilder;
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

	public static prepareName(name: string): string {
		return XRegExp.replace(name ?? "", XRegExp("[^\\pL\\pN]+"), "", "all").toLowerCase();
	}
}
