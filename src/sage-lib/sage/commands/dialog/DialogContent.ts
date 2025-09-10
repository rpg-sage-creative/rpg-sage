import type { HexColorString } from "@rsc-utils/core-utils";
import type { DialogType } from "../../repo/base/IdRepository.js";
import type { TDialogType } from "./TDialogType.js";

export type DialogContent = {
	/** preset dialog prefix */
	type?: TDialogType;

	/** aliased dialog prefix */
	alias?: string;

	/** if true, post the attachment with this dialog */
	attachment?: boolean;

	postType?: DialogType;

	/** character name */
	name?: string;

	/** the name to post as */
	displayName?: string;

	/** url of an image to post in an embed dialog (discord's thumbnailURL) */
	embedImageUrl?: string;

	/** url of an image to post alongside the dialog (discord's avatarURL) */
	dialogImageUrl?: string;

	/** color on the left of the embedded dialog box */
	embedColor?: HexColorString;

	/** the dialog content */
	content: string;
};