import type { Snowflake } from "discord.js";
import * as _XRegExp from "xregexp";
import { PathbuilderCharacter, TPathbuilderCharacter } from "../../../sage-pf2e";
import type { Args, Optional, UUID } from "../../../sage-utils";
import { isNonNilSnowflake } from "../../../sage-utils/utils/DiscordUtils";
import type DiscordKey from "../../../sage-utils/utils/DiscordUtils/DiscordKey";
import type { TDialogMessage } from "../repo/DialogMessageRepository";
import DialogMessageRepository from "../repo/DialogMessageRepository";
import CharacterManager from "./CharacterManager";
import type { IHasSave } from "./NamedCollection";
import NoteManager, { type TNote } from "./NoteManager";
const XRegExp: typeof _XRegExp = (_XRegExp as any).default;

export type TGameCharacterTag = "pc" | "npc" | "gm" | "ally" | "enemy" | "boss";

export type TGameCharacterType = "gm" | "npc" | "pc" | "companion";
export interface GameCharacterCore {
	/** Channels to automatically treat input as dialog */
	autoChannels?: Snowflake[];
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
	userDid?: Snowflake;
}
// 		export type TPlayerCharacterImageType = "Default"
// 												| "Token" | "TokenBloody" | "TokenDying"
// 												| "Profile" | "ProfileBloody" | "ProfileDying"
// 												| "Full" | "FullBloody" | "FullDying";

/** Determine if the snowflakes are different. */
function diff(a?: Snowflake, b?: Snowflake) {
	const aIsNotNil = isNonNilSnowflake(a);
	const bIsNotNil = isNonNilSnowflake(b);
	return aIsNotNil && bIsNotNil && a !== b;
}

function keyMatchesMessage(discordKey: DiscordKey, dialogMessage: TDialogMessage): boolean {
	const messageKey = DialogMessageRepository.ensureDiscordKey(dialogMessage).discordKey;
	return messageKey.channel === discordKey.channel;
}

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
	public get autoChannels(): Snowflake[] { return this.core.autoChannels ?? (this.core.autoChannels = []); }

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

	public addAutoChannel(did: Snowflake, save = true): Promise<boolean> {
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

	public hasAutoChannel(channelId: Optional<Snowflake>): boolean {
		if (channelId) {
			return this.autoChannels.includes(channelId);
		}
		return false;
	}

	public removeAutoChannel(did: Snowflake, save = true): Promise<boolean> {
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
		const dialogMessageKey = DialogMessageRepository.ensureDiscordKey(dialogMessage).discordKey;
		const lastMessages = this.lastMessages;
		// we only replace the last message for the given thread/channel in a given server; so keep the others
		const filtered = lastMessages.filter(lastMessage => {
			const lastMessageKey = DialogMessageRepository.ensureDiscordKey(lastMessage).discordKey;
			if (diff(lastMessageKey.server, dialogMessageKey.server)) {
				return true;
			}
			return diff(lastMessageKey.channel, dialogMessageKey.channel);
		});

		// lastMessages is a reference to the core's object, manipulate it directly
		lastMessages.length = 0;
		lastMessages.push(...filtered);
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

	public update(values: Args<GameCharacterCore>, save = true): Promise<boolean> {
		let changed = false;
		const keys = Object.keys(values) as (keyof GameCharacterCore)[];
		keys.forEach(key => {
			const value = values[key];
			if (value !== undefined && value !== this[key]) {
				if (value === null) {
					delete this.core[key];
				}else {
					/** @todo is there a better way than casting as any to avoid this flagging as an error? */
					this.core[key] = value as any;
					if (key === "name") {
						delete this._preparedName;
					}else if (key === "pathbuilder") {
						delete this._pathbuilder;
					}
					changed = true;
				}
			}
		});
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
