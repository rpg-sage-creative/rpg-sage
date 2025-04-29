import { parseEnum, type Snowflake } from "@rsc-utils/core-utils";
import { getSelectedOrDefault, getSelectedOrDefaultNumber } from "../../../../../gameSystems/p20/lib/getSelectedOrDefault.js";
import { Macro } from "../../../model/Macro.js";
import { MacroOwnerType, type MacroOwnerTypeKey } from "../../../model/MacroOwner.js";
import { Macros, type FindMacrosAndMacroResult, type MacroIndex } from "../../../model/Macros.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { SageInteraction } from "../../../model/SageInteraction.js";
import { createCustomId as _createCustomId, parseCustomId, type CustomIdArgs, type MacroActionKey } from "./customId.js";

/** Contains values from message/slash commands: name="", cat="", dice="" */
type ArgValues = {
	name?: string;
	category?: string;
	contentKey?: string;
	content?: string;
	ownerType: MacroOwnerTypeKey;
	charName?: string;
};

/** Checks the SageCommand for ArgValues, using multiple keys (ex: cat *AND* category) for user convenience. */
export function getArgValues(sageComand: SageCommand): ArgValues {
	const pair = (...keys: string[]) => {
		const key = keys.find(key => sageComand.args.hasString(key));
		return key ? { key, value:sageComand.args.getString(key)! } : undefined;
	};

	const name = pair("name")?.value;
	const category = pair("cat", "category")?.value;
	const content = pair("dialog", "dice", "items", "math", "table", "tableUrl");
	const macroOwnerType = parseEnum<MacroOwnerType>(MacroOwnerType, pair("tier", "type")?.value) ?? MacroOwnerType.user;
	const ownerType = MacroOwnerType[macroOwnerType] as MacroOwnerTypeKey;
	const charName = pair("charName")?.value;

	return { name, category, contentKey:content?.key, content:content?.value, ownerType, charName };
}

/** State of the control representing currently selected values from the form; passed as part of customId values. */
export type MacroState<HasMacro extends boolean = false> = MacroIndex & {
	ownerType: HasMacro extends true ? MacroOwnerTypeKey : MacroOwnerTypeKey | undefined;
	ownerPageIndex: number;
	ownerId: HasMacro extends true ? Snowflake : Snowflake | undefined;
};

/**
 * Updates the given indexes object with values from args.
 * The keys are tested in the order we select them from the control so that we can proper clear out child values when selecting a new higher level item.
 */
function updateMacroIndex(indexes: MacroIndex, args: Partial<MacroIndex>): MacroIndex {
	const ret = (changes: Partial<MacroIndex>) => ({ categoryPageIndex:-1, categoryIndex:-1, macroPageIndex:-1, macroIndex:-1, ...changes });

	const { categoryPageIndex = -1, categoryIndex = -1, macroPageIndex = -1, macroIndex = -1 } = args;

	if (categoryPageIndex !== indexes.categoryPageIndex) {
		return ret({ categoryPageIndex });
	}

	if (categoryIndex !== indexes.categoryIndex) {
		return ret({ categoryPageIndex, categoryIndex });
	}

	if (macroPageIndex !== indexes.macroPageIndex) {
		return ret({ categoryPageIndex, categoryIndex, macroPageIndex });
	}

	if (macroIndex !== indexes.macroIndex) {
		return ret({ categoryPageIndex, categoryIndex, macroPageIndex, macroIndex });
	}

	return { categoryPageIndex, categoryIndex, macroPageIndex, macroIndex };
}

/**
 * Updates the given state object with values from args.
 * The keys are tested in the order we select them from the control so that we can proper clear out child values when selecting a new higher level item.
 */
function updateMacroState(state: MacroState, args: Partial<MacroState>): MacroState {
	const ret = (changes: Partial<MacroState>) => ({ ownerType:undefined, ownerPageIndex:-1, ownerId:undefined, categoryPageIndex:-1, categoryIndex:-1, macroPageIndex:-1, macroIndex:-1, ...changes });

	const { ownerType, ownerPageIndex = -1, ownerId } = args;

	// if we are setting the owner type/id at the same time, we need to check em both first to ensure we get ownerId
	if (ownerType !== state.ownerType && ownerId !== state.ownerId) {
		return ret({ ownerType, ownerId });
	}

	if (ownerType !== state.ownerType) {
		return ret({ ownerType });
	}

	if (ownerPageIndex !== state.ownerPageIndex) {
		return ret({ ownerType, ownerPageIndex });
	}

	if (ownerId !== state.ownerId) {
		return ret({ ownerType, ownerPageIndex, ownerId });
	}

	return ret({ ownerType, ownerPageIndex, ownerId, ...updateMacroIndex(state, args) });
}

/** Represents the state as it was when the command fired and the state that will be when the command finishes. */
export type Args<HasMacros extends boolean = false, HasMacro extends boolean = false> = {
	/** The state information from the control that triggered the command. Possibly undefined if triggered by a Message/Slash command. */
	customIdArgs: HasMacro extends true ? CustomIdArgs : CustomIdArgs | undefined;
	/** The macro represented by the next state. */
	macro: HasMacro extends true ? Macro : Macro | undefined;
	/** The macros represented by the next state. */
	macros: HasMacros extends true ? Macros : Macros | undefined;
	/** The previous and next states. */
	state: {
		/** The beginning state of the command. */
		prev: MacroState<HasMacro>;
		/** The ending state of the command. */
		next: MacroState;
	};
};

/** This type simply overrides customIdArgs to always be defined for Interactions. */
export type InteractionArgs<HasMacros extends boolean = false, HasMacro extends boolean = false> = Args<HasMacros, HasMacro> & {
	/** The state information from the control that triggered the interaction. */
	customIdArgs: CustomIdArgs;
};

export const INVALID_ACTOR_ERROR = "INVALID_ACTOR_ERROR";
export function isInvalidActorError(err: unknown): boolean {
	return err instanceof Error && err.message === INVALID_ACTOR_ERROR;
}

async function findMacros(sageCommand: SageCommand, state?: MacroState): Promise<Partial<FindMacrosAndMacroResult>> {
	// if we have the owner type and id from state, then
	if (state?.ownerType && state.ownerId) {
		const macros = await Macros.parse(sageCommand, { type:state.ownerType, id:state.ownerId });
		return { macros };
	}

	// if we have category or name in Message/Slash args, then
	const { category, name } = getArgValues(sageCommand);
	if (name) {
		return Macros.findMacrosAndMacro(sageCommand, name) ?? { };
	}
	if (category) {
		return Macros.findMacrosAndCategory(sageCommand, category) ?? { };
	}

	return { };
}

/** Creates a default MacroState. */
function createState(): MacroState {
	return { ownerType:undefined, ownerPageIndex:-1, ownerId:undefined, categoryPageIndex:-1, categoryIndex:-1, macroPageIndex:-1, macroIndex:-1 };
}

export async function getArgs<HasMacros extends boolean = false, HasMacro extends boolean = false>(sageInteraction: SageInteraction): Promise<InteractionArgs<HasMacros, HasMacro>>;
export async function getArgs<HasMacros extends boolean = false, HasMacro extends boolean = false>(sageCommand: SageCommand): Promise<Args<HasMacros, HasMacro>>;
export async function getArgs(sageCommand: SageCommand): Promise<Args> {
	// parse customIdArgs
	const customIdArgs = sageCommand.parseCustomId(parseCustomId);

	// we need this a couple times below
	const { actorId } = sageCommand;

	// we need to disallow using another user's macros form ... except to start a copy process.
	if (customIdArgs && actorId !== customIdArgs.actorId && customIdArgs.action !== "showCopyMacro") throw new Error(INVALID_ACTOR_ERROR);

	// if we are resetting the control, return clean args now
	if (customIdArgs?.action === "resetControl") {
		return { customIdArgs, macros:undefined, macro:undefined, state: { prev:createState(), next:createState() } };
	}

	const { messageId, state = createState() } = customIdArgs ?? {};

	let { macros, categoryMeta, macroMeta } = await findMacros(sageCommand, customIdArgs?.state);
	if (macros) {
		// update the state
		state.ownerType = macros.owner.type;
		state.ownerPageIndex = -1;
		state.ownerId = macros.owner.id;
		// if we have a macroMeta, we got it from a message/slash and can return args now
		if (macroMeta) {
			state.categoryPageIndex = macroMeta.categoryPageIndex;
			state.categoryIndex = macroMeta.categoryIndex;
			state.macroPageIndex = macroMeta.macroPageIndex;
			state.macroIndex = macroMeta.macroIndex;
			return { customIdArgs, macros, macro:macroMeta.macro, state: { prev:{ ...state }, next:{ ...state } } };
		}
		// if we have a categoryMeta, we got it from a message/slash and can return args now
		if (categoryMeta) {
			state.categoryPageIndex = categoryMeta.categoryPageIndex;
			state.categoryIndex = categoryMeta.categoryIndex;
			return { customIdArgs, macros, macro:undefined, state: { prev:{ ...state }, next:{ ...state } } };
		}
	}
	let macro = macroMeta?.macro;

	const createCustomId = (action: MacroActionKey) => _createCustomId({ action, actorId, messageId, state });
	const ret = (args: Partial<MacroState>) => {
		const updatedArgs = { customIdArgs, macro, macros, state:{ prev:state, next:updateMacroState(state, args) } };
		return updatedArgs;
	};

	let { ownerType } = state;
	const selectOwnerTypeId = createCustomId("selectOwnerType");
	if (sageCommand.customIdMatches(selectOwnerTypeId)) {
		ownerType = getSelectedOrDefault(sageCommand, selectOwnerTypeId) as MacroOwnerTypeKey;
		let ownerId: Snowflake | undefined;
		if (ownerType === "user") {
			ownerId = sageCommand.actorId;
		}
		if (ownerType === "game") {
			ownerId = sageCommand.game?.id as Snowflake;
		}
		if (ownerType === "server") {
			ownerId = sageCommand.server.did;
		}
		if (ownerType === "global") {
			ownerId = sageCommand.bot.id as Snowflake;
		}
		if (ownerId) {
			macros = await Macros.parse(sageCommand, { id:ownerId, type:ownerType });
			return ret({ ownerType, ownerId });
		}
		macros = undefined;
		return ret({ ownerType });
	}

	let { ownerPageIndex } = state;
	const selectOwnerPageIndexId = createCustomId("selectOwnerPage");
	if (sageCommand.customIdMatches(selectOwnerPageIndexId)) {
		ownerPageIndex = getSelectedOrDefaultNumber(sageCommand, selectOwnerPageIndexId) ?? -1;
		macros = undefined;
		return ret({ ownerType, ownerPageIndex });
	}

	let { ownerId } = state;
	const selectOwnerId = createCustomId("selectOwnerId");
	if (sageCommand.customIdMatches(selectOwnerId)) {
		ownerId = getSelectedOrDefault(sageCommand, selectOwnerId) as Snowflake;
		macros = await Macros.parse(sageCommand, { id:ownerId, type:ownerType! });
		return ret({ ownerType, ownerPageIndex, ownerId });
	}

	let { categoryPageIndex } = state;
	const categoryPageIndexId = createCustomId("selectCategoryPage");
	if (sageCommand.customIdMatches(selectOwnerId)) {
		categoryPageIndex = getSelectedOrDefaultNumber(sageCommand, categoryPageIndexId) ?? -1;
		return ret({ ownerType, ownerPageIndex, ownerId, categoryPageIndex });
	}

	let { categoryIndex } = state;
	const categoryIndexId = createCustomId("selectCategory");
	if (sageCommand.customIdMatches(categoryIndexId)) {
		categoryIndex = getSelectedOrDefaultNumber(sageCommand, categoryIndexId) ?? -1;
		return ret({ ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex });
	}

	let { macroPageIndex } = state;
	const macroPageIndexId = createCustomId("selectMacroPage");
	if (sageCommand.customIdMatches(macroPageIndexId)) {
		macroPageIndex = getSelectedOrDefaultNumber(sageCommand, macroPageIndexId) ?? -1;
		return ret({ ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex, macroPageIndex });
	}

	let { macroIndex } = state;
	const macroIndexId = createCustomId("selectMacro");
	if (sageCommand.customIdMatches(macroIndexId)) {
		macroIndex = getSelectedOrDefaultNumber(sageCommand, macroIndexId) ?? -1;
	}

	macro = macros?.getMacro({ categoryPageIndex, categoryIndex, macroPageIndex, macroIndex });

	return ret({ ownerType, ownerPageIndex, ownerId, categoryPageIndex, categoryIndex, macroPageIndex, macroIndex });
}