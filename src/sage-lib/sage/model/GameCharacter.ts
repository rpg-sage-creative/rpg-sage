import type * as Discord from "discord.js";
import { PathbuilderCharacter, TPathbuilderCharacter } from "../../../sage-pf2e";
import type { UUID } from "../../../sage-utils";
import * as _XRegExp from "xregexp";
import { DiscordKey } from "../../discord";
import CharacterManager from "./CharacterManager";
import type { IHasSave } from "./NamedCollection";
import NoteManager, { type TNote } from "./NoteManager";
const XRegExp: typeof _XRegExp = (_XRegExp as any).default;


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
export type TGameCharacterType = "gm" | "npc" | "pc" | "companion";
export interface GameCharacterCore {
	/** Channels to automatically treat input as dialog */
	autoChannels?: Discord.Snowflake[];
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
	/** The image used to represent the character to the left of the post */
	tokenUrl?: string;
	/** The character's user's Discord ID */
	userDid?: Discord.Snowflake;
}
// 		export type TPlayerCharacterImageType = "Default"
// 												| "Token" | "TokenBloody" | "TokenDying"
// 												| "Profile" | "ProfileBloody" | "ProfileDying"
// 												| "Full" | "FullBloody" | "FullDying";


//#region Core Updates

interface IOldGameCharacterCore extends GameCharacterCore {
	iconUrl?: string;
}

function updateCore(core: IOldGameCharacterCore): GameCharacterCore {
	//#region move .iconUrl to .avatarUrl
	if (core.iconUrl) {
		core.avatarUrl = core.iconUrl;
	}
	delete core.iconUrl;
	//#endregion
	return core;
}

//#endregion

export default class GameCharacter implements IHasSave {
	public constructor(private core: GameCharacterCore, protected owner?: CharacterManager) {
		updateCore(core);

		this.core.companions = CharacterManager.from(this.core.companions as GameCharacterCore[] ?? [], this, "companion");

		this.isGM = this.type === "npc" && this.name === (this.owner?.gmCharacterName ?? GameCharacter.defaultGmCharacterName);
		this.isNPC = this.type === "npc";
		this.isGMorNPC = this.isGM || this.isNPC;

		this.isCompanion = this.type === "companion";
		this.isPC = this.type === "pc";
		this.isPCorCompanion = this.isPC || this.isCompanion;

		this.notes = new NoteManager(this.core.notes ?? (this.core.notes = []), this.owner);
	}

	/** Channels to automatically treat input as dialog */
	public get autoChannels(): Discord.Snowflake[] { return this.core.autoChannels ?? (this.core.autoChannels = []); }

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
	public get lastMessages(): TDialogMessage[] { return this.core.lastMessages ?? (this.core.lastMessages = []); }

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

	public addAutoChannel(did: Discord.Snowflake, save = true): Promise<boolean> {
		const autoChannels = this.autoChannels;
		if (!autoChannels.includes(did)) {
			autoChannels.push(did);
			if (save) {
				return this.save();
			}
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

	public hasAutoChannel(did: Discord.Snowflake): boolean {
		return this.autoChannels.includes(did);
	}

	public removeAutoChannel(did: Discord.Snowflake, save = true): Promise<boolean> {
		const autoChannels = this.autoChannels;
		const index = autoChannels.indexOf(did);
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

	public getLastMessage(discordKey: DiscordKey): TDialogMessage | undefined;
	public getLastMessage(channelDid: Discord.Snowflake, threadDid?: Discord.Snowflake): TDialogMessage | undefined;
	public getLastMessage(didOrKey: DiscordKey | Discord.Snowflake, threadDid?: Discord.Snowflake): TDialogMessage | undefined {
		let channelDid: Discord.Snowflake;
		if (didOrKey instanceof DiscordKey) {
			channelDid = didOrKey.channel;
			threadDid = didOrKey.thread;
		}else {
			channelDid = didOrKey;
		}
		if (threadDid) {
			return this.lastMessages.find(lastMessage => lastMessage.threadDid === threadDid);
		}
		return this.lastMessages.find(lastMessage => lastMessage.threadDid === channelDid || lastMessage.channelDid === channelDid);
	}

	public getLastMessages(discordKey: DiscordKey): TDialogMessage[];
	public getLastMessages(channelDid: Discord.Snowflake, threadDid?: Discord.Snowflake): TDialogMessage[];
	public getLastMessages(didOrKey: DiscordKey | Discord.Snowflake, threadDid?: Discord.Snowflake): TDialogMessage[] {
		const dialogMessages: TDialogMessage[] = [];
		const lastMessage = this.getLastMessage(didOrKey as Discord.Snowflake, threadDid!);
		if (lastMessage) {
			dialogMessages.push(lastMessage);
		}
		this.companions.forEach(companion => {
			dialogMessages.push(...companion.getLastMessages(didOrKey as Discord.Snowflake, threadDid!));
		});
		// lastMessages.sort((a, b) => a.timestamp - b.timestamp);
		return dialogMessages;
	}

	public setLastMessage(dialogMessage: TDialogMessage): void {
		const lastMessages = this.lastMessages;

		const lastMessage = this.getLastMessage(dialogMessage.channelDid, dialogMessage.threadDid);
		if (lastMessage) {
			const index = lastMessages.indexOf(lastMessage);
			lastMessages.splice(index, 1);
		}

		lastMessages.push(dialogMessage);
	}

	//#endregion

	/** Compares name literal, then preparedName. If recursive, it also checks companions. */
	public matches(name: string, recursive = false): boolean {
		if (this.name === name || this.preparedName === GameCharacter.prepareName(name)) {
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

	private _pathbuilder: PathbuilderCharacter | null | undefined;
	public get pathbuilder(): PathbuilderCharacter | null {
		if (this._pathbuilder === undefined && this.core.pathbuilder) {
			this._pathbuilder = new PathbuilderCharacter(this.core.pathbuilder);
		}
		return this._pathbuilder ?? null;
	}

	public update(values: Partial<GameCharacterCore>, save = true): Promise<boolean> {
		let changed = false;
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
	public save(): Promise<boolean> {
		return this.owner?.save() ?? Promise.resolve(false);
	}
	//#endregion

	public static defaultGmCharacterName = "Game Master";

	public static prepareName(name: string): string {
		return XRegExp.replace(name ?? "", XRegExp("[^\\pL\\pN]+"), "", "all").toLowerCase();
	}
}
