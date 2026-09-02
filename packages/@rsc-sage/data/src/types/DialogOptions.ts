import { isNonNilSnowflake, isNotBlank, type Snowflake } from "@rsc-utils/core-utils";
import { assertNumber, assertString, optional, renameProperty } from "../validation/index.js";
import { DialogPostType, MoveDirectionOutputType } from "./enums/index.js";

export type DialogOptionsAny = DialogOptionsOld | DialogOptions;

export type DialogOptionsOld = DialogOptions & {
	/** @deprecated use .dialogPostType */
	defaultDialogType?: number;
	/** @deprecated use .gmCharacterName */
	defaultGmCharacterName?: string;
};

export type DialogOptions = {
	dialogPostType?: DialogPostType;
	gmCharacterName?: string;
	mentionPrefix?: string;
	moveDirectionOutputType?: number;
	sendDialogTo?: Snowflake;
};

export const DialogOptionsKeys: (keyof DialogOptions)[] = [
	"dialogPostType",
	"gmCharacterName",
	"mentionPrefix",
	"moveDirectionOutputType",
	"sendDialogTo",
];

/** dialogPostType, gmCharacterName, mentionPrefix, moveDirectionOutputType, sendDialogTo */
export function assertDialogOptions({ core, objectType }: { core:DialogOptionsAny; objectType:string; }): boolean {

	if (!assertNumber({ core, objectType, key:"dialogPostType", optional, validator:DialogPostType })) return false;
	if (!assertString({ core, objectType, key:"gmCharacterName", validator:isNotBlank, optional })) return false;
	if (!assertString({ core, objectType, key:"mentionPrefix", validator:isNotBlank, optional })) return false;
	if (!assertNumber({ core, objectType, key:"moveDirectionOutputType", optional, validator:MoveDirectionOutputType })) return false;
	if (!assertString({ core, objectType, key:"sendDialogTo", optional, validator:isNonNilSnowflake })) return false;

	return true;
}

export function ensureDialogOptions(core: DialogOptionsOld): DialogOptions {

	renameProperty({ core, oldKey:"defaultDialogType", newKey:"dialogPostType" });
	renameProperty({ core, oldKey:"defaultGmCharacterName", newKey:"gmCharacterName" });

	return core;
}
