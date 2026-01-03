import type { Optional } from "@rsc-utils/core-utils";
import type { DialogType } from "./DialogType.js";

const DialogTypes: DialogType[] = ["edit","gm","npc","ally","enemy","boss","minion","pc","alt","companion","familiar","hireling"] as const;

export function matchDialogType(typeOrAlias: Optional<string>): DialogType | undefined {
	if (!typeOrAlias) return undefined;
	const lower = typeOrAlias.toLowerCase();
	return DialogTypes.find(type => type === lower);
}