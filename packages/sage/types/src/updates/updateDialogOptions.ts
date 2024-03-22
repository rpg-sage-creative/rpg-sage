import { isDefined } from "@rsc-utils/type-utils";
import type { DialogOptions } from "../SageChannel.js";

export type OldDialogOptions = DialogOptions & {
	/** @deprecated */
	defaultDialogType?: number;
};

export function updateDialogOptions(options: OldDialogOptions): void {
	if (isDefined(options.defaultDialogType)) {
		options.dialogPostType = options.defaultDialogType;
		delete options.defaultDialogType;
	}
}