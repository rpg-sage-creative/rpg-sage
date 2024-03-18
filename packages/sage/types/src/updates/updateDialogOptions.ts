import { isDefined } from "@rsc-utils/type-utils";
import { PostType } from "../PostType.js";
import type { DialogOptions } from "../SageChannel.js";

export type OldDialogOptions = DialogOptions & {
	/** @deprecated */
	defaultDialogType?: number;
};

export function updateDialogOptions(options: OldDialogOptions): void {
	if (isDefined(options.defaultDialogType)) {
		options.dialogPostType = options.defaultDialogType === 1 ? PostType.Content : PostType.Embed;
		delete options.defaultDialogType;
	}
}