import { getSuperAdminId, getSuperUserId } from "@rsc-sage/env";
import { applyChanges, type Args, type IdCore, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { MoveDirectionOutputType } from "../commands/map/MoveDirection.js";
import { HasSageCacheCore } from "../repo/base/HasSageCacheCore.js";
import type { DialogType } from "../repo/base/IdRepository.js";
import { CharacterManager } from "./CharacterManager.js";
import type { GameCharacter, GameCharacterCore } from "./GameCharacter.js";
import type { MacroBase } from "./Macro.js";
import { NoteManager, type TNote } from "./NoteManager.js";
import type { SageCache } from "./SageCache.js";

export type TAlias = {
	name: string;
	target: string;
};

// export enum PatronTierType { None = 0, Friend = 1, Informant = 2, Trusted = 3 }
// export const PatronTierSnowflakes: Snowflake[] = [undefined!, "730147338529669220", "730147486446125057", "730147633867259904"];

export enum DialogDiceBehaviorType { Default = 0, Inline = 1 };

/**
 * @todo consider flag for AoN Legacy vs Remaster
 */
export interface UserCore extends IdCore<"User"> {

	aliases?: TAlias[];

	defaultDialogType?: DialogType;

	defaultSagePostType?: DialogType;

	dialogDiceBehaviorType?: DialogDiceBehaviorType;
	/** undefined is false (the default logic doesn't send on delete) */
	dmOnDelete?: boolean;

	/** undefined is true (the default logic does send on delete) */
	dmOnEdit?: boolean;

	macros?: MacroBase[];

	moveDirectionOutputType?: MoveDirectionOutputType;

	nonPlayerCharacters?: (GameCharacter | GameCharacterCore)[];

	notes?: TNote[];

	/** @deprecated */
	patronTier?: number;

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

	delete core.patronTier;

	return core;
}

//#endregion

type UpdateArgs = Args<{
	dialogDiceBehaviorType: DialogDiceBehaviorType;
	dialogPostType: DialogType;
	dmOnDelete: boolean;
	dmOnEdit: boolean;
	moveDirectionOutputType: MoveDirectionOutputType;
	sagePostType: DialogType;
}>;

export class User extends HasSageCacheCore<UserCore> {

	public isSuperAdmin: boolean;
	public isSuperUser: boolean;

	public constructor(core: UserCore, sageCache: SageCache) {
		super(updateCore(core), sageCache);

		this.core.nonPlayerCharacters = CharacterManager.from(this.core.nonPlayerCharacters as GameCharacterCore[] ?? [], this, "npc");
		this.core.playerCharacters = CharacterManager.from(this.core.playerCharacters as GameCharacterCore[] ?? [], this, "pc");

		this.notes = new NoteManager(this.core.notes ?? (this.core.notes = []));

		this.isSuperAdmin = core.did === getSuperAdminId();
		this.isSuperUser = core.did === getSuperUserId();
	}

	public get aliases(): TAlias[] { return this.core.aliases ??= []; }
	public get macros() { return this.core.macros ??= []; }
	public get nonPlayerCharacters(): CharacterManager { return this.core.nonPlayerCharacters as CharacterManager; }
	public notes: NoteManager;
	public get playerCharacters(): CharacterManager { return this.core.playerCharacters as CharacterManager; }

	//#region settings

	/** @deprecated use .dialogPostType */
	public get defaultDialogType(): DialogType | undefined { return this.dialogPostType; }

	/** @deprecated use .sagePostType */
	public get defaultSagePostType(): DialogType | undefined { return this.sagePostType; }

	public get dialogDiceBehaviorType() { return this.core.dialogDiceBehaviorType; }

	public get dialogPostType(): DialogType | undefined { return this.core.defaultDialogType; }

	/** undefined is false (the default logic doesn't send on delete) */
	public get dmOnDelete(): boolean { return this.core.dmOnDelete ?? false; }

	/** undefined is true (the default logic does send on edit) */
	public get dmOnEdit(): boolean { return this.core.dmOnEdit ?? true; }

	public get preferredLang(): "en-US" { return "en-US"; }

	public get moveDirectionOutputType(): MoveDirectionOutputType | undefined { return this.core.moveDirectionOutputType; }

	public get sagePostType(): DialogType | undefined { return this.core.defaultSagePostType; }

	//#endregion

	public findCharacterOrCompanion(name: string): GameCharacter | undefined {
		return this.playerCharacters.findByName(name)
			?? this.playerCharacters.findCompanionByName(name)
			?? this.nonPlayerCharacters.findByName(name)
			?? this.nonPlayerCharacters.findCompanionByName(name);
	}

	public getAutoCharacterForChannel(...channelDids: Optional<Snowflake>[]): GameCharacter | undefined {
		for (const channelDid of channelDids) {
			if (channelDid) {
				const autoChannelData = { channelDid, userDid:this.did };
				return this.playerCharacters.getAutoCharacter(autoChannelData)
					?? this.nonPlayerCharacters.getAutoCharacter(autoChannelData);
			}
		}
		return undefined;
	}

	public async update({ dialogDiceBehaviorType, dialogPostType, dmOnDelete, dmOnEdit, sagePostType, moveDirectionOutputType }: UpdateArgs): Promise<boolean> {
		const changed = applyChanges(this.core, {
			dialogDiceBehaviorType,
			defaultDialogType:dialogPostType,
			defaultSagePostType:sagePostType,
			dmOnDelete,
			dmOnEdit,
			moveDirectionOutputType
		});
		return changed ? this.save() : false;
	}

	public async save(): Promise<boolean> {
		return this.sageCache.saveUser(this);
	}

	public static createCore(userId: Snowflake): UserCore {
		return { objectType: "User", did: userId, id: userId };
	}

}
