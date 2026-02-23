import { renameProperty } from "../../validation/index.js";
import type { DialogOptionsV0, DialogOptionsV1 } from "./DialogOptions.js";

export function ensureDialogOptionsV1(core: DialogOptionsV0): DialogOptionsV1 {

	renameProperty({ core, oldKey:"defaultDialogType", newKey:"dialogPostType" });
	renameProperty({ core, oldKey:"defaultGmCharacterName", newKey:"gmCharacterName" });

	return core;
}
