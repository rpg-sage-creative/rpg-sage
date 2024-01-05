import type { DialogType } from "../../repo/base/IdRepository";
import type { TDialogType } from "./TDialogType";

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

	/** url of an image to post in an embed dialog */
	imageUrl?: string;

	/** color on the left of the embedded dialog box */
	embedColor?: string;

	/** the dialog content */
	content: string;
};