import type { Snowflake } from "@rsc-utils/core-utils";
import type { DialogPostType } from "../enums/DialogPostType.js";

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