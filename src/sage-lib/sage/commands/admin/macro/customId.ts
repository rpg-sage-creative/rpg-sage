import { type Optional, type Snowflake, compressId, decompressId } from "@rsc-utils/core-utils";
import { MacroOwnerType, type MacroOwnerTypeKey } from "../../../model/MacroOwner.js";
import type { MacroState } from "./getArgs.js";

export type MacroActionKey = keyof typeof MacroAction;

export enum MacroAction {
	selectOwnerType,
	selectOwnerPage,
	selectOwnerId,

	selectCategoryPage,
	selectCategory,

	selectMacroPage,
	selectMacro,

	showRollButtons,
	showEditButtons,
	showOtherButtons,

	showNewMacroModal,
	handleNewMacroModal,
	confirmNewMacro,
	cancelNewMacro,

	showEditMacroModal,
	handleEditMacroModal,
	confirmEditMacro,
	cancelEditMacro,

	showCopyMacro,

	promptDeleteMacro,
	confirmDeleteMacro,
	cancelDeleteMacro,

	promptDeleteAll,
	confirmDeleteAll,
	cancelDeleteAll,

	rollMacro,
	showMacroArgs,
	rollMacroArgs,

	resetControl
}
// | "copyMacro" | "deleteCategory" | "deleteAll"

export type CustomIdArgs = {
	/** needed for SageInteraction.parseCustomId */
	indicator: "macros";

	/** the user doing actions */
	actorId: Snowflake;

	state: MacroState;

	/** what are we doing */
	action: MacroActionKey;

	/** message that opened the modal */
	messageId?: Snowflake;
};

export function createCustomId({ actorId, state, action, messageId }: Omit<CustomIdArgs, "indicator">): string {
	const { ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex, macroPageIndex, macroIndex } = state;
	return [
		"macros",
		compressId(actorId, 16),
		[MacroOwnerType[ownerType!] ?? "", ownerPageIndex, compressId(ownerId, 16) ?? "", categoryPageIndex, categoryIndex, macroPageIndex, macroIndex].join(","),
		MacroAction[action],
		compressId(messageId, 16) ?? "",
	].join("|");
}

export function createCustomIdRegExp(...actions: MacroActionKey[]): RegExp {
	const source = [
		/macros/,
		/(?<actorId>[\da-f]+)/,
		/(?<ownerType>\d)?,(?<ownerPageIndex>-?\d+),(?<ownerId>[\da-f]+)?,(?<categoryPageIndex>-?\d+),(?<categoryIndex>-?\d+),(?<macroPageIndex>-?\d+),(?<macroIndex>-?\d+)/,
		new RegExp(`(?<action>${actions.length ? actions.map(key => MacroAction[key]).join("|") : "\\d+"})`),
		/(?<messageId>[\da-f]+)?/,
	].map(r => r.source).join(`\\|`);
	return new RegExp(`^${source}$`);
}

export function parseCustomId(customId: Optional<string>): CustomIdArgs {
	const match = customId ? createCustomIdRegExp().exec(customId) : undefined;
	const { actorId, ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex, macroPageIndex, macroIndex, action, messageId } = match?.groups ?? {};
	return {
		indicator: "macros",
		actorId: decompressId(actorId, 16) as Snowflake,
		state: {
			ownerType: MacroOwnerType[+ownerType] as MacroOwnerTypeKey,
			ownerPageIndex: +ownerPageIndex,
			ownerId: decompressId(ownerId, 16) as Snowflake,
			categoryPageIndex: +categoryPageIndex,
			categoryIndex: +categoryIndex,
			macroPageIndex: +macroPageIndex,
			macroIndex: +macroIndex,
		},
		action: MacroAction[+action] as MacroActionKey,
		messageId: decompressId(messageId, 16) as Snowflake,
	};
}
