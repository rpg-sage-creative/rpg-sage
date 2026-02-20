import type { Snowflake } from "@rsc-utils/core-utils";
import type { DialogPostType } from "../enums/DialogPostType.js";

export type DialogOptions = {
	dialogPostType: DialogPostType;
	gmCharacterName: string;
	mentionPrefix?: string;
	moveDirectionOutputType?: number;
	sendDialogTo: Snowflake;
};