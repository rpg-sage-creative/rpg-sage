import type { Snowflake } from "@rsc-utils/snowflake-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { type DidCore, HasDidCore } from "../repo/base/DidRepository";
import type { DialogType } from "../repo/base/IdRepository";
import CharacterManager from "./CharacterManager";
import type GameCharacter from "./GameCharacter";
import type { GameCharacterCore } from "./GameCharacter";
import { NamedCollection } from "./NamedCollection";
import NoteManager, { TNote } from "./NoteManager";
import type SageCache from "./SageCache";

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

export interface UserCore extends DidCore<"User"> {
	aliases?: TAlias[];
	defaultDialogType?: DialogType;
	defaultSagePostType?: DialogType;
	macros?: TMacro[];
	nonPlayerCharacters?: (GameCharacter | GameCharacterCore)[];
	notes?: TNote[];
	patronTier?: PatronTierType;
	playerCharacters?: (GameCharacter | GameCharacterCore)[];
}

//#region Core Updates

interface IOldUserCore extends UserCore {
	/** Phase out in favor of playerCharacters */
	characters?: GameCharacterCore[];
}

function updateCore(core: IOldUserCore): UserCore {
	//#region move .characters to .playerCharacters
	if (core.characters) {
		core.playerCharacters = core.characters;
	}
	delete core.characters;
	//#endregion
	return core;
}

//#endregion

export class User extends HasDidCore<UserCore> {
	public constructor(core: UserCore, sageCache: SageCache) {
		super(updateCore(core), sageCache);

		this.core.aliases = NamedCollection.from(this.core.aliases ?? [], this);
		this.core.macros = NamedCollection.from(this.core.macros ?? [], this);

		this.core.nonPlayerCharacters = CharacterManager.from(this.core.nonPlayerCharacters as GameCharacterCore[] ?? [], this, "npc");
		this.core.playerCharacters = CharacterManager.from(this.core.playerCharacters as GameCharacterCore[] ?? [], this, "pc");

		this.notes = new NoteManager(this.core.notes ?? (this.core.notes = []), this);

		this.isFriend = this.core.patronTier === PatronTierType.Friend;
		this.isInformant = this.core.patronTier === PatronTierType.Informant;
		this.isTrusted = this.core.patronTier === PatronTierType.Trusted;
		this.isPatron = this.isFriend || this.isInformant || this.isTrusted;
	}
	public get aliases(): NamedCollection<TAlias> { return this.core.aliases as NamedCollection<TAlias>; }
	public get defaultDialogType(): DialogType | undefined { return this.core.defaultDialogType; }
	public get defaultSagePostType(): DialogType | undefined { return this.core.defaultSagePostType; }
	public get macros(): NamedCollection<TMacro> { return this.core.macros as NamedCollection<TMacro>; }
	public get nonPlayerCharacters(): CharacterManager { return this.core.nonPlayerCharacters as CharacterManager; }
	public notes: NoteManager;
	public get playerCharacters(): CharacterManager { return this.core.playerCharacters as CharacterManager; }

	public get patronTier(): PatronTierType { return this.core.patronTier ?? 0; }
	public set patronTier(patronTierType: PatronTierType) { this.core.patronTier = patronTierType; }
	public isFriend: boolean;
	public isInformant: boolean;
	public isTrusted: boolean;
	public isPatron: boolean;
	public get isSuperUser(): boolean { return User.isSuperUser(this.did); }

	public getAutoCharacterForChannel(...channelDids: Optional<Snowflake>[]): GameCharacter | undefined {
		for (const channelDid of channelDids) {
			if (channelDid) {
				const autoChannelData = { channelDid, userDid:this.did };
				return this.playerCharacters.getAutoCharacter(autoChannelData)
					?? this.nonPlayerCharacters.getAutoCharacter(autoChannelData)
					?? undefined;
			}
		}
		return undefined;
	}

	private updateDialogType(dialogType: Optional<DialogType>): void { this.core.defaultDialogType = dialogType === null ? undefined : dialogType ?? this.core.defaultDialogType; }
	private updateSagePostType(sagePostType: Optional<DialogType>): void { this.core.defaultSagePostType = sagePostType === null ? undefined : sagePostType ?? this.core.defaultSagePostType; }
	public update({ dialogType, sagePostType }: { dialogType?: Optional<DialogType>, sagePostType?: Optional<DialogType> }): Promise<boolean> {
		this.updateDialogType(dialogType);
		this.updateSagePostType(sagePostType);
		return this.save();
	}

	public async save(): Promise<boolean> {
		return this.sageCache.users.write(this);
	}

	public static createCore(userDid: Snowflake): UserCore {
		return { objectType: "User", did: userDid, id: null! };
	}

	public static SuperUserDid = "253330271678627841";
	public static isSuperUser(userDid: Optional<Snowflake>): boolean {
		return userDid === User.SuperUserDid;
	}

}
