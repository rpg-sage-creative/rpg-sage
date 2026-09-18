import type { Optional } from "@rsc-utils/type-utils";

export type CodeName = "dev" | "beta" | "stable";

export type EnvironmentName = "development" | "test" | "production";

/** @internal */
export type ValidatorArg = string | number | boolean | string[];
/** @internal */
export type Validator = (value: Optional<ValidatorArg>) => value is ValidatorArg;

/** @internal */
export type Region = "us-west-1" | "us-west-2" | "us-east-1" | "us-east-2";
