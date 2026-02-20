import { DialogPostType, ensureSageUserCore, type Alias, type DialogDiceBehaviorType, type SageUserCore } from "@rsc-sage/data-layer";
import { isSuperAdminId, isSuperUserId } from "@rsc-sage/env";
import { applyChanges, stringOrUndefined, type Args, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { MoveDirectionOutputType } from "../commands/map/MoveDirection.js";
import { HasSageCacheCore } from "../repo/base/HasSageCacheCore.js";
import { CharacterManager } from "./CharacterManager.js";
import type { GameCharacter, GameCharacterCore } from "./GameCharacter.js";
import { NamedCollection } from "./NamedCollection.js";
import { NoteManager } from "./NoteManager.js";
import type { SageCache } from "./SageCache.js";

/**
 * @todo consider flag for AoN Legacy vs Remaster
 */
export type UserCore = Omit<SageUserCore, "playerCharacters"> & {
	playerCharacters?: (GameCharacter | GameCharacterCore)[];
}

//#region Core Updates

function updateCore(core: UserCore): UserCore {
	return ensureSageUserCore(core as SageUserCore, { ver:1 }) as UserCore;
}

//#endregion

type UpdateArgs = Args<{
	dialogDiceBehaviorType: DialogDiceBehaviorType;
	dialogPostType: DialogPostType;
	dmOnDelete: boolean;
	dmOnEdit: boolean;
	mentionPrefix: string;
	moveDirectionOutputType: MoveDirectionOutputType;
	sagePostType: DialogPostType;
	confirmationPrompts: boolean;
	forceConfirmationFlag: string;
	skipConfirmationFlag: string;
}>;

export class User extends HasSageCacheCore<UserCore> {

	public isSuperAdmin: boolean;
	public isSuperUser: boolean;

	public constructor(core: UserCore, sageCache: SageCache) {
		super(updateCore(core), sageCache);

		this.core.aliases = NamedCollection.from(this.core.aliases ?? [], this);

		this.core.playerCharacters = CharacterManager.from(this.core.playerCharacters as GameCharacterCore[] ?? [], this, "pc");

		this.notes = new NoteManager(this.core.notes ??= []);

		this.isSuperAdmin = isSuperAdminId(core.id) || isSuperAdminId(core.did);
		this.isSuperUser = isSuperUserId(core.id) || isSuperUserId(core.did);
	}

	public get aliases(): NamedCollection<Alias> { return this.core.aliases as NamedCollection<Alias>; }
	public get macros() { return this.core.macros ??= []; }
	public nonPlayerCharacters = CharacterManager.from([], this, "npc");
	public notes: NoteManager;
	public get playerCharacters(): CharacterManager { return this.core.playerCharacters as CharacterManager; }

	//#region settings

	/** @deprecated use .dialogPostType */
	public get defaultDialogType(): DialogPostType | undefined { return this.dialogPostType; }

	/** @deprecated use .sagePostType */
	public get defaultSagePostType(): DialogPostType | undefined { return this.sagePostType; }

	public get dialogDiceBehaviorType() { return this.core.dialogDiceBehaviorType; }

	public get dialogPostType(): DialogPostType | undefined { return this.core.defaultDialogType; }

	/** undefined is false (the default logic doesn't send on delete) */
	public get dmOnDelete(): boolean { return this.core.dmOnDelete ?? false; }

	/** undefined is true (the default logic does send on edit) */
	public get dmOnEdit(): boolean { return this.core.dmOnEdit ?? true; }

	public get preferredLang(): "en-US" { return "en-US"; }

	public get moveDirectionOutputType(): MoveDirectionOutputType | undefined { return this.core.moveDirectionOutputType; }

	public get sagePostType(): DialogPostType | undefined { return this.core.defaultSagePostType; }

	public get mentionPrefix(): string | undefined { return this.core.mentionPrefix; }
	public set mentionPrefix(mentionPrefix: string | undefined) { this.core.mentionPrefix = stringOrUndefined(mentionPrefix); }

	public get confirmationPrompts(): boolean | undefined { return this.core.confirmationPrompts; }
	public set confirmationPrompts(confirmationPrompts: boolean | undefined) { this.core.confirmationPrompts = confirmationPrompts; }

	public get forceConfirmationFlag(): string | undefined { return this.core.forceConfirmationFlag; }
	public set forceConfirmationFlag(forceConfirmationFlag: string | undefined) { this.core.forceConfirmationFlag = stringOrUndefined(forceConfirmationFlag); }

	public get skipConfirmationFlag(): string | undefined { return this.core.skipConfirmationFlag; }
	public set skipConfirmationFlag(skipConfirmationFlag: string | undefined) { this.core.skipConfirmationFlag = stringOrUndefined(skipConfirmationFlag); }

	//#endregion

	public findCharacterOrCompanion(name: string): GameCharacter | undefined {
		return this.playerCharacters.findByName(name)
			?? this.playerCharacters.findCompanion(name);
	}

	public getAutoCharacterForChannel(...channelDids: Optional<Snowflake>[]): GameCharacter | undefined {
		for (const channelDid of channelDids) {
			if (channelDid) {
				const autoChannelData = { channelDid, userDid:this.did };
				return this.playerCharacters.getAutoCharacter(autoChannelData);
			}
		}
		return undefined;
	}

	public async update({ dialogDiceBehaviorType, dialogPostType, dmOnDelete, dmOnEdit, mentionPrefix, moveDirectionOutputType, sagePostType, confirmationPrompts, forceConfirmationFlag, skipConfirmationFlag }: UpdateArgs): Promise<boolean> {
		const changed = applyChanges(this.core, {
			dialogDiceBehaviorType,
			defaultDialogType:dialogPostType,
			defaultSagePostType:sagePostType,
			dmOnDelete,
			dmOnEdit,
			mentionPrefix,
			moveDirectionOutputType,
			confirmationPrompts,
			forceConfirmationFlag,
			skipConfirmationFlag,
		});
		return changed ? this.save() : false;
	}

	public async save(): Promise<boolean> {
		return this.sageCache.saveUser(this);
	}

	public static createCore(userId: Snowflake): UserCore {
		return { did:userId, id:userId, objectType:"User", ver:1 };
	}

}
