import { NIL_SNOWFLAKE, type Optional, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { MacroOwnerType, type MacroOwnerTypeKey } from "../../../model/MacroOwner.js";
import type { MacroState } from "./getArgs.js";

function compressId(value?: Snowflake | UUID): string | undefined {
	if (!value) return undefined;

	// remove dashes from uuid
	if (value.includes("-")) return value.replace(/-/g, "");

	// convert snowflake to hex
	return BigInt(value).toString(16);
}

function decompressId<Type extends Snowflake | UUID>(value?: string): Type | undefined {
	if (!value) return undefined;

	// put dashes back into uuid
	if (value.length === 32) {
		return [
			value.slice(0, 8),
			value.slice(8, 12),
			value.slice(12, 16),
			value.slice(16, 20),
			value.slice(20)
		].join("-") as Type;
	}

	if (value === "0") {
		return NIL_SNOWFLAKE as string as Type;
	}

	// convert hex to snowflake
	return BigInt(`0x${value}`).toString() as Type;
}

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
		compressId(actorId),
		[MacroOwnerType[ownerType!] ?? "", ownerPageIndex, compressId(ownerId) ?? "", categoryPageIndex, categoryIndex, macroPageIndex, macroIndex].join(","),
		MacroAction[action],
		compressId(messageId) ?? "",
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
		actorId: decompressId(actorId) as Snowflake,
		state: {
			ownerType: MacroOwnerType[+ownerType] as MacroOwnerTypeKey,
			ownerPageIndex: +ownerPageIndex,
			ownerId: decompressId(ownerId) as Snowflake,
			categoryPageIndex: +categoryPageIndex,
			categoryIndex: +categoryIndex,
			macroPageIndex: +macroPageIndex,
			macroIndex: +macroIndex,
		},
		action: MacroAction[+action] as MacroActionKey,
		messageId: decompressId(messageId) as Snowflake,
	};
}
