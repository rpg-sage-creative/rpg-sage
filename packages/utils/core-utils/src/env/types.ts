import type { Optional } from "../types/generics.js";

export type CodeName = "dev" | "beta" | "stable";

export type EnvironmentName = "development" | "test" | "production";

/** @internal */
export type Validator = (value: Optional<string | number>) => value is string | number;

/** @internal */
export type Region = "us-west-1" | "us-west-2" | "us-east-1" | "us-east-2";
