import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import type { SageCore } from "../../other/SageCore.js";

export type SageGameCoreV0 = SageCore<"User", Snowflake | UUID> & { };