import type { Snowflake } from "@rsc-utils/core-utils";
import type { SageCommand } from "../../../model/SageCommand.js";
import { HasMacros, type Macro, type MacroOwnerType } from "./HasMacros.js";

type Args = {
	category?: string;
	name?: string;
	ownerId?: Snowflake;
	ownerType?: MacroOwnerType;
};

/**
 * Finds the macro for the given name/category.
 * The returned macro has extended values to prepare for expanded macro logic.
 * @todo Revisit this logic and description when we expand OwnerType.
 */
export function findMacro(sageCommand: SageCommand, args: Args): Macro | undefined {
	return HasMacros.from(sageCommand.sageUser).find(args);
}