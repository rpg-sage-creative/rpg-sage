import { isNonNilSnowflake, isNotBlank } from "@rsc-utils/core-utils";
import { assertNumber, assertString, optional } from "../../validation/index.js";
import { DialogPostType, MoveDirectionOutputType } from "../enums/index.js";
import type { DialogOptionsAny } from "./DialogOptions.js";

/** dialogPostType, gmCharacterName, mentionPrefix, moveDirectionOutputType, sendDialogTo */
export function assertDialogOptions({ core, objectType }: { core:DialogOptionsAny; objectType:string; }): boolean {

	if (!assertNumber({ core, objectType, key:"dialogPostType", optional, validator:DialogPostType })) return false;
	if (!assertString({ core, objectType, key:"gmCharacterName", validator:isNotBlank, optional })) return false;
	if (!assertString({ core, objectType, key:"mentionPrefix", validator:isNotBlank, optional })) return false;
	if (!assertNumber({ core, objectType, key:"moveDirectionOutputType", optional, validator:MoveDirectionOutputType })) return false;
	if (!assertString({ core, objectType, key:"sendDialogTo", optional, validator:isNonNilSnowflake })) return false;

	return true;
}