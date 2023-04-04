import type { Args, Optional } from "../../../sage-utils";
import { DidCore, HasDidCore } from "../repo";
import type { DialogType } from "../repo";
import { CharacterManager } from "./CharacterManager";
import type { GameCharacter } from "./GameCharacter";
import type { GameCharacterCore, TGameCharacterTag } from "./GameCharacter";
import { NamedCollection } from "./NamedCollection";
import { NoteManager,  TNote } from "./NoteManager";
import type { SageCache } from "./SageCache";
import { applyValues } from "./SageCommandArgs";
import { readJsonFile } from "../../../sage-utils/FsUtils";
import type { Snowflake } from "discord.js";
import type { UUID } from "../../../sage-utils/UuidUtils";

export type TAlias = {
	name: string;
	target: string;
};
export type TMacro = {
	category?: string;
	name: string;
	dice: string;
};
export enum PatronTierType { None = 0, Friend = 1, Informant = 2, Trusted = 3 }
export const PatronTierSnowflakes: Snowflake[] = [undefined!, "730147338529669220", "730147486446125057", "730147633867259904"];

export type TUserOptions = {
	defaultDialogType: DialogType;
	defaultSagePostType: DialogType;
}

type TUserCharacter = {
	charId: UUID;
	tags: TGameCharacterTag[];
};

export interface UserCore extends DidCore<"User">, Partial<TUserOptions> {
	aliases?: TAlias[];
	allowDynamicDialogSeparator?: boolean;
	macros?: TMacro[];
	notes?: TNote[];
	patronTier?: PatronTierType;
	characters?: TUserCharacter[];
}

export class User extends HasDidCore<UserCore> {
	public constructor(core: UserCore, sageCache: SageCache) {
		super(core, sageCache);

		this.core.aliases = NamedCollection.from(this.core.aliases ?? [], this);
		this.core.macros = NamedCollection.from(this.core.macros ?? [], this);

		this.notes = new NoteManager(this.core.notes ?? (this.core.notes = []), this);
	}
	public get aliases(): NamedCollection<TAlias> { return this.core.aliases as NamedCollection<TAlias>; }
	public get allowDynamicDialogSeparator(): boolean { return this.core.allowDynamicDialogSeparator === true; }
	public set allowDynamicDialogSeparator(allowDynamicDialogSeparator: boolean) { this.core.allowDynamicDialogSeparator = allowDynamicDialogSeparator === true; }
	public get defaultDialogType(): DialogType | undefined { return this.core.defaultDialogType; }
	public get defaultSagePostType(): DialogType | undefined { return this.core.defaultSagePostType; }
	public get macros(): NamedCollection<TMacro> { return this.core.macros as NamedCollection<TMacro>; }
	public notes: NoteManager;

	//#region characters

	private characters = new Map<string, CharacterManager>();

	private async fetchCharacters(tag: "pc" | "npc"): Promise<CharacterManager> {
		if (!this.characters.has(tag)) {
			const cores: GameCharacterCore[] = [];
			const chars = this.core.characters?.filter(char => char.tags.includes(tag)) ?? [];
			for (const char of chars) {
				const core = await User.fetchCharacter(this.did, char.charId);
				if (core) {
					cores.push(core);
				}
			}
			this.characters.set(tag, CharacterManager.from(cores, this, tag));
		}
		return this.characters.get(tag)!;
	}

	public async fetchPlayerCharacters(): Promise<CharacterManager> {
		return this.fetchCharacters("pc");
	}

	public async fetchNonPlayerCharacters(): Promise<CharacterManager> {
		return this.fetchCharacters("npc");
	}

	//#endregion

	public get patronTier(): PatronTierType { return this.core.patronTier ?? 0; }
	public set patronTier(patronTierType: PatronTierType) { this.core.patronTier = patronTierType; }
	public isFriend = this.core.patronTier === PatronTierType.Friend;
	public isInformant = this.core.patronTier === PatronTierType.Informant;
	public isTrusted = this.core.patronTier === PatronTierType.Trusted;
	public isPatron = this.isFriend || this.isInformant || this.isTrusted;
	public get isSuperUser(): boolean { return User.isSuperUser(this.did); }

	public async fetchAutoCharacterForChannel(did: Optional<Snowflake>): Promise<GameCharacter | undefined> {
		if (did) {
			const pcs = await this.fetchPlayerCharacters();
			const pc = pcs.find(char => char.hasAutoChannel(did));
			if (pc) {
				return pc;
			}
			const npcs = await this.fetchNonPlayerCharacters();
			const npc = npcs.find(char => char.hasAutoChannel(did));
			return npc;
		}
		return undefined;
	}

	public update(opts: Args<TUserOptions>): Promise<boolean> {
		applyValues(this.core, opts);
		return this.save();
	}

	public async save(): Promise<boolean> {
		return this.sageCache.users.write(this);
	}

	public static async fetchCharacter(userDid: Snowflake, charId: UUID): Promise<GameCharacterCore | null> {
		/** @todo sort out a variable for the path root */
		const path = `./sage/data/users/${userDid}/characters/${charId}.json`;
		return readJsonFile<GameCharacterCore>(path);
	}

	public static createCore(userDid: Snowflake): UserCore {
		return { objectType: "User", did: userDid, id: null! };
	}

	public static SuperUserDid = "253330271678627841";
	public static isSuperUser(userDid: Optional<Snowflake>): boolean {
		return userDid === User.SuperUserDid;
	}

}
