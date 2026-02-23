import type { Snowflake } from "@rsc-utils/core-utils";
import type { DialogPostType } from "../enums/DialogPostType.js";

export type DialogOptionsOld = DialogOptionsV0;
export type DialogOptions = DialogOptionsV1;
export type DialogOptionsAny = DialogOptionsOld | DialogOptions;

export type DialogOptionsV0 = DialogOptionsV1 & {
	/** @deprecated use .dialogPostType */
	defaultDialogType?: number;
	/** @deprecated use .gmCharacterName */
	defaultGmCharacterName?: string;
};

export type DialogOptionsV1 = {
	dialogPostType: DialogPostType;
	gmCharacterName: string;
	mentionPrefix?: string;
	moveDirectionOutputType?: number;
	sendDialogTo: Snowflake;
};