import type { Optional } from "@rsc-utils/type-utils";
import type * as Discord from "discord.js";
import XRegExp from "xregexp";
import { PathbuilderCharacter, TPathbuilderCharacter, getExplorationModes, getSkills } from "../../../sage-pf2e";
import type { UUID } from "../../../sage-utils";
import { DiscordKey, NilSnowflake } from "../../discord";
import { DialogType } from "../repo/base/IdRepository";
import CharacterManager from "./CharacterManager";
import type { IHasSave } from "./NamedCollection";
import NoteManager, { type TNote } from "./NoteManager";
import { TKeyValuePair } from "./SageMessageArgsManager";

export type TDialogMessage = {
	channelDid: Discord.Snowflake;
	characterId: UUID;
	gameId: UUID;
	messageDid: Discord.Snowflake;
	serverDid: Discord.Snowflake;
	threadDid: Discord.Snowflake;
	timestamp: number;
	userDid: Discord.Snowflake;
};
export type TGameCharacterType = "gm" | "npc" | "pc" | "companion" | "minion";
type AutoChannelData = {
	channelDid: Discord.Snowflake;
	dialogPostType?: DialogType;
	userDid?: Discord.Snowflake;
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
	/** Discord compatible color: 0x001122 */
	embedColor?: string;
	/** Unique ID of this character */
	id: UUID;
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
	userDid?: Discord.Snowflake;
}
// 		export type TPlayerCharacterImageType = "Default"
// 												| "Token" | "TokenBloody" | "TokenDying"
// 												| "Profile" | "ProfileBloody" | "ProfileDying"
// 												| "Full" | "FullBloody" | "FullDying";

/** Determine if the snowflakes are different. */
function diff(a?: Discord.Snowflake, b?: Discord.Snowflake) {
	return (a ?? NilSnowflake) !== (b ?? NilSnowflake);
}

/** Temp convenience function to get a DiscordKey from varying input */
export function toDiscordKey(channelDidOrDiscordKey: DiscordKey | Discord.Snowflake, threadDid?: Discord.Snowflake): DiscordKey {
	if (channelDidOrDiscordKey instanceof DiscordKey) {
		return channelDidOrDiscordKey;
	}
	return new DiscordKey(null, channelDidOrDiscordKey, threadDid);
}
function keyMatchesMessage(discordKey: DiscordKey, dialogMessage: TDialogMessage): boolean {
	const hasThread = (dialogMessage.threadDid ?? NilSnowflake) !== NilSnowflake;
	if (hasThread) {
		return dialogMessage.channelDid === discordKey.channel
			&& dialogMessage.threadDid === discordKey.thread;
	}
	if (discordKey.hasThread) {
		return dialogMessage.channelDid === discordKey.thread;
	}
	return dialogMessage.channelDid === discordKey.channel;
}

//#region Core Updates

interface IOldGameCharacterCore extends Omit<GameCharacterCore, "autoChannels"> {
	autoChannels?: (Discord.Snowflake | AutoChannelData)[];
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
	//#region move .iconUrl to .avatarUrl
	if (core.iconUrl) {
		core.avatarUrl = core.iconUrl;
	}
	delete core.iconUrl;
	//#endregion
	return core as GameCharacterCore;
}

//#endregion

export default class GameCharacter implements IHasSave {
	public constructor(private core: GameCharacterCore, protected owner?: CharacterManager) {
		updateCore(core);

		const characterType = owner?.characterType === "pc" ? "companion" : "minion";
		this.core.companions = CharacterManager.from(this.core.companions as GameCharacterCore[] ?? [], this, characterType);

		this.isGM = this.type === "npc" && this.name === (this.owner?.gmCharacterName ?? GameCharacter.defaultGmCharacterName);
		this.isNPC = this.type === "npc";
		this.isGMorNPC = this.isGM || this.isNPC;

		this.isCompanion = this.type === "companion";
		this.isPC = this.type === "pc";
		this.isPCorCompanion = this.isPC || this.isCompanion;

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

	/** Discord compatible color: 0x001122 */
	public get embedColor(): string | undefined { return this.core.embedColor; }
	public set embedColor(embedColor: string | undefined) { this.core.embedColor = embedColor; }

	/** Unique ID of this character */
	public get id(): UUID { return this.core.id; }

	public isCompanion: boolean;// = this.type === "companion";
	public isGM: boolean;// = this.type === "npc" && this.name === (this.owner?.gmCharacterName ?? GameCharacter.defaultGmCharacterName);
	public isNPC: boolean;// = this.type === "npc";
	public isGMorNPC: boolean;// = this.isGM || this.isNPC;
	public isPC: boolean;// = this.type === "pc";
	public isPCorCompanion: boolean;// = this.isPC || this.isCompanion;

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
			// TODO: FIND A BETTER WAY!
			this._parent = this.type === "companion" && this.owner ? (this.owner as any).owner ?? null : null;
		}
		return this._parent ?? undefined;
	}
	/** The ID of the parent of a companion. */
	public get parentId(): UUID | undefined { return this.parent?.id; }

	private _preparedAlias?: string;
	private get preparedAlias(): string { return this._preparedAlias ?? (this._preparedAlias = GameCharacter.prepareName(this.alias ?? this.name)); }
	private _preparedName?: string;
	private get preparedName(): string { return this._preparedName ?? (this._preparedName = GameCharacter.prepareName(this.name)); }

	/** The image used to represent the character to the left of the post. */
	public get tokenUrl(): string | undefined { return this.core.tokenUrl; }
	public set tokenUrl(tokenUrl: string | undefined) { this.core.tokenUrl = tokenUrl; }

	public get type(): TGameCharacterType { return this.owner?.characterType ?? "gm"; }

	/** The character's user's Discord ID */
	public get userDid(): Discord.Snowflake | undefined { return this.core.userDid; }
	public set userDid(userDid: Discord.Snowflake | undefined) { this.core.userDid = userDid; }

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

		return null;
	}
	public async updateStats(pairs: TKeyValuePair[], save: boolean): Promise<boolean> {
		let changes = false;
		const forNotes: TKeyValuePair[] = [];
		const pb = this.pathbuilder;
		for (const pair of pairs) {
			const { key, value } = pair;
			let correctedKey: string | undefined;
			let correctedValue: string | undefined;
			if (/^name$/i.test(key) && value?.trim() && (this.name !== value || (pb && pb.name !== value))) {
				this.name = value;
				if (pb) {
					pb.name = value;
				}
				changes ||= true;
				continue;
			}
			const isExplorationMode = /^explorationmode$/i.test(key);
			if (isExplorationMode) {
				correctedKey = "explorationMode";
				const modeRegex = new RegExp(`^${value.replace(/(\s)/g, "$1?")}$`, "i");
				correctedValue = getExplorationModes().find(mode => modeRegex.test(mode));
			}
			const isExplorationSkill = /^explorationskill$/i.test(key);
			if (isExplorationSkill) {
				correctedKey = "explorationSkill";
				const skillRegex = new RegExp(`^${value.replace(/(\s)/g, "$1?")}$`, "i");
				correctedValue = getSkills().find(skill => skillRegex.test(skill));
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

	public update(values: Partial<GameCharacterCore>, save = true): Promise<boolean> {
		let changed = false;
		if (values.alias !== undefined) {
			this.alias = values.alias;
			this._preparedAlias = undefined;
			changed = true;
		}
		if (values.avatarUrl !== undefined) {
			this.avatarUrl = values.avatarUrl;
			changed = true;
		}
		if (values.embedColor !== undefined) {
			this.embedColor = values.embedColor;
			changed = true;
		}
		if (values.tokenUrl !== undefined) {
			this.tokenUrl = values.tokenUrl;
			changed = true;
		}
		if (values.name !== undefined && values.name !== this.name) {
			this.name = values.name;
			this._preparedName = undefined;
			changed = true;
		}
		if (values.userDid !== undefined && values.userDid !== this.userDid) {
			this.userDid = values.userDid;
			changed = true;
		}
		if (values.pathbuilder !== undefined) {
			this.core.pathbuilder = values.pathbuilder;
			delete this._pathbuilder;
			changed = true;
		}
		if (changed && save) {
			return this.save();
		}
		return Promise.resolve(false);
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

	public static defaultGmCharacterName = "Game Master";

	public static prepareName(name: string): string {
		return XRegExp.replace(name ?? "", XRegExp("[^\\pL\\pN]+"), "", "all").toLowerCase();
	}
}
