import { isNotBlank } from "@rsc-utils/core-utils";
import type { DialogOptions } from "../options/DialogOptions.js";

export type OldDialogOptions = DialogOptions & {
	/** @deprecated */
	defaultDialogType?: number;
	/** @deprecated */
	defaultGmCharacterName?: string;
};

export function updateDialogOptions(options: OldDialogOptions): void {
	if ("defaultDialogType" in options) {
		if (options.defaultDialogType === 0 || options.defaultDialogType === 1) {
			options.dialogPostType = options.defaultDialogType;
		}
		delete options.defaultDialogType;
	}
	if ("defaultGmCharacterName" in options) {
		if (isNotBlank(options.defaultGmCharacterName)) {
			options.gmCharacterName = options.defaultGmCharacterName;
		}
		delete options.defaultGmCharacterName;
	}
}