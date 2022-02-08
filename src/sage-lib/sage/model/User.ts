import type * as Discord from "discord.js";
import type { Optional } from "../../../sage-utils";
import { DidCore, HasDidCore } from "../repo/base/DidRepository";
import CharacterManager from "./CharacterManager";
import type GameCharacter from "./GameCharacter";
import type { GameCharacterCore } from "./GameCharacter";
import NamedCollection from "./NamedCollection";
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
export const PatronTierSnowflakes: Discord.Snowflake[] = [undefined!, "730147338529669220", "730147486446125057", "730147633867259904"];

export interface UserCore extends DidCore<"User"> {
	aliases?: TAlias[];
	allowDynamicDialogSeparator?: boolean;
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

export default class User extends HasDidCore<UserCore> {
	public constructor(core: UserCore, sageCache: SageCache) {
		super(updateCore(core), sageCache);

		this.core.aliases = NamedCollection.from(this.core.aliases ?? [], this);
		this.core.macros = NamedCollection.from(this.core.macros ?? [], this);

		this.core.nonPlayerCharacters = CharacterManager.from(this.core.nonPlayerCharacters as GameCharacterCore[] ?? [], this, "npc");
		this.core.playerCharacters = CharacterManager.from(this.core.playerCharacters as GameCharacterCore[] ?? [], this, "pc");

		this.notes = new NoteManager(this.core.notes ?? (this.core.notes = []), this);
	}
	public get aliases(): NamedCollection<TAlias> { return this.core.aliases as NamedCollection<TAlias>; }
	public get allowDynamicDialogSeparator(): boolean { return this.core.allowDynamicDialogSeparator === true; }
	public set allowDynamicDialogSeparator(allowDynamicDialogSeparator: boolean) { this.core.allowDynamicDialogSeparator = allowDynamicDialogSeparator === true; }
	public get macros(): NamedCollection<TMacro> { return this.core.macros as NamedCollection<TMacro>; }
	public get nonPlayerCharacters(): CharacterManager { return this.core.nonPlayerCharacters as CharacterManager; }
	public notes: NoteManager;
	public get playerCharacters(): CharacterManager { return this.core.playerCharacters as CharacterManager; }

	public get patronTier(): PatronTierType { return this.core.patronTier ?? 0; }
	public set patronTier(patronTierType: PatronTierType) { this.core.patronTier = patronTierType; }
	public isFriend = this.core.patronTier === PatronTierType.Friend;
	public isInformant = this.core.patronTier === PatronTierType.Informant;
	public isTrusted = this.core.patronTier === PatronTierType.Trusted;
	public isPatron = this.isFriend || this.isInformant || this.isTrusted;

	public getAutoCharacterForChannel(did: Optional<Discord.Snowflake>): GameCharacter | undefined {
		if (did) {
			return this.playerCharacters.find(char => char.hasAutoChannel(did))
				?? this.nonPlayerCharacters.find(char => char.hasAutoChannel(did));
		}
		return undefined;
	}

	public async save(): Promise<boolean> {
		return this.sageCache.users.write(this);
	}

	public static createCore(userDid: Discord.Snowflake): UserCore {
		return { objectType: "User", did: userDid, id: null! };
	}

	public static SuperUserDid = "253330271678627841";
	public static isSuperUser(userDid: Optional<Discord.Snowflake>): boolean {
		return userDid === User.SuperUserDid;
	}

}
