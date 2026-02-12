import type { Snowflake } from "@rsc-utils/core-utils";
import type { DialogDiceBehaviorType, DialogPostType, MacroBase, MoveDirectionOutputType, Note, SageCore } from "../../types/index.js";
import type { SageCharacterV2 } from "../character/index.js";

export type UserDataV2 = {
	characters?: SageCharacterV2[];
	macros?: MacroBase[];
	notes?: Note[];
};

export const UserDataV2Keys: (keyof UserDataV2)[] = [
	"characters",
	"macros",
	"notes",
];

export type UserSettingsV2 = {
	confirmationPrompts?: boolean;
	defaultDialogType?: DialogPostType;
	defaultSagePostType?: DialogPostType;
	dialogDiceBehaviorType?: DialogDiceBehaviorType;
	dmOnDelete?: boolean;
	dmOnEdit?: boolean;
	forceConfirmationFlag?: string;
	mentionPrefix?: string;
	moveDirectionOutputType?: MoveDirectionOutputType;
	skipConfirmationFlag?: string;
};

export const UserSettingsV2Keys: (keyof UserSettingsV2)[] = [
	"confirmationPrompts",
	"defaultDialogType",
	"defaultSagePostType",
	"dialogDiceBehaviorType",
	"dmOnDelete",
	"dmOnEdit",
	"forceConfirmationFlag",
	"mentionPrefix",
	"moveDirectionOutputType",
	"skipConfirmationFlag",
];

export type UserV2 = SageCore<"User", Snowflake> & {
	settings: UserSettingsV2;
	updatedTs: number;
	ver: number;
};

export const UserV2Keys: (keyof UserV2)[] = [
	"did",
	"id",
	"objectType",
	"settings",
	"updatedTs",
	"uuid",
	"ver"
];
