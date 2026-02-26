import { renameProperty } from "../../validation/index.js";
import type { DialogOptionsOld, DialogOptions } from "./DialogOptions.js";

export function ensureDialogOptions(core: DialogOptionsOld): DialogOptions {

	renameProperty({ core, oldKey:"defaultDialogType", newKey:"dialogPostType" });
	renameProperty({ core, oldKey:"defaultGmCharacterName", newKey:"gmCharacterName" });

	return core;
}
