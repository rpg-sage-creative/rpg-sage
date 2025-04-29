import type { TDialogType } from "./TDialogType.js";

export function matchDialogType(typeOrAlias: string): TDialogType | undefined {
	const types: TDialogType[] = ["edit","gm","npc","ally","enemy","boss","minion","pc","alt","companion","familiar","hireling"];
	return types.find(type => type === typeOrAlias.toLowerCase());
}