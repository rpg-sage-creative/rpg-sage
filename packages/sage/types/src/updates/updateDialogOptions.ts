import { isDefined } from "@rsc-utils/type-utils";
import type { DialogOptions } from "../SageChannel.js";

export type OldDialogOptions = DialogOptions & {
	/** @deprecated */
	defaultDialogType?: number;
	/** @deprecated */
	defaultGmCharacterName?: string;
};

export function updateDialogOptions(options: OldDialogOptions): void {
	if (isDefined(options.defaultDialogType)) {
		options.dialogPostType = options.defaultDialogType;
		delete options.defaultDialogType;
	}
	if (isDefined(options.defaultGmCharacterName)) {
		options.gmCharacterName = options.defaultGmCharacterName;
		delete options.defaultGmCharacterName;
	}
}