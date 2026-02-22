import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import type { SageCore } from "../../other/SageCore.js";

export type SageGameCoreV1 = SageCore<"User", Snowflake | UUID> & { };

export const SageGameV1Keys: (keyof SageGameCoreV1)[] = [
	"did",
	"id",
	"objectType",
	"uuid",
	"ver"
];