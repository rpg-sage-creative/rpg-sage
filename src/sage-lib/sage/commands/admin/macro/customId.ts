import type { Snowflake } from "@rsc-utils/core-utils";
import { stringOrUndefined } from "@rsc-utils/string-utils";

export type MacroAction =
	"selectCategoryPage" | "selectCategory"
	| "selectMacroPage" | "selectMacro"
	| "promptDeleteMacro" | "confirmDeleteMacro" | "cancelDeleteMacro"
	| "showEditMacro" | "promptEditMacro" | "confirmEditMacro" | "cancelEditMacro"
	| "newMacro" | "copyMacro"
	| "deleteCategory" | "deleteAll"
	;

type MacroType = "character" | "user" | "game" | "server" | "global";

export type CustomIdArgs = {
	/** needed for SageInteraction.parseCustomId */
	indicator: "macro";

	/** the user doing actions */
	userId: Snowflake;

	/** which type of macro are we dealing with, determines owner id */
	type: MacroType;

	/** id that owns the macros/categories: char id, user id, game id, server id */
	ownerId: Snowflake;

	/** what are we doing */
	action: MacroAction;

	/** message that opened the modal */
	messageId?: Snowflake;

	/** what are we doing it to: macro name or category name */
	name?: string;
};

export type Uncategorized = "Uncategorized";
export const Uncategorized: Uncategorized = "Uncategorized";

export function createCustomId({ action, messageId, name, ownerId, type, userId }: Omit<CustomIdArgs, "indicator">): string {
	return [
		userId,
		type,
		ownerId,
		action,
		messageId ?? "",
		name ?? "",
	].join("|")
}

export function createCustomIdRegExp(...actions: MacroAction[]): RegExp {
	return new RegExp([
		/(?<userId>\d{16,})/,
		/(?<ownerType>character|user|game|server|global)/,
		/(?<ownerId>\d{16,})/,
		new RegExp(`(?<action>${actions.join("|")})`),
		/(?<messageId>\d{16,})?/,
		/(?<macroName>\w*)/
	].map(r => r.source).join(`\\|`));
}

export function parseCustomId(customId: string): CustomIdArgs {
	const [
		userId,
		type,
		ownerId,
		action,
		messageId,
		name,
	] = customId.split("|");
	return {
		indicator: "macro",
		userId: userId as Snowflake,
		type: type as MacroType,
		ownerId: ownerId as Snowflake,
		action: action as MacroAction,
		messageId: stringOrUndefined(messageId) as Snowflake,
		name: stringOrUndefined(name),
	};
}
