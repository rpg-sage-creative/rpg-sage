import type { Optional } from "../types/generics.js";
import { getFromProcess } from "./internal/getFromProcess.js";

function isValidEmailAddress(value: Optional<string | number>): value is string {
	return /^[a-z.]+@[a-z]+\.[a-z]+$/.test(String(value));
}

type Region = "us-west-1" | "us-west-2" | "us-east-1" | "us-east-2";
function isValidRegion(value: Optional<string | number>): value is Region {
	return ["us-west-1", "us-west-2", "us-east-1", "us-east-2"].includes(String(value));
}

/**
 * Intended for use with @aws-sdk/client-ses
 */
export function getSesInfo() {
	const toAddress = getFromProcess<string>(isValidEmailAddress, "sesToAddress");
	const fromAddress = getFromProcess<string>(isValidEmailAddress, "sesFromAddress");
	const region = getFromProcess<Region>(isValidRegion, "sesRegion");
	return { toAddress, fromAddress, region };
}