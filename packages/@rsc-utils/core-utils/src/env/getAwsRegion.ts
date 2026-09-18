import type { Optional } from "@rsc-utils/type-utils";
import { getFromProcessSafely } from "./getFromProcessSafely.js";
import type { Region, ValidatorArg } from "./types.js";

export function getAwsRegion(key: string): Region | undefined {
	const regionValidator = (value: Optional<ValidatorArg>): value is Region => {
		return ["us-west-1", "us-west-2", "us-east-1", "us-east-2"].includes(value as string);
	};

	return getFromProcessSafely<Region>(regionValidator, key);
}