import type { Optional } from "../types/generics.js";
import { getFromProcess } from "./internal/getFromProcess.js";


type Region = "us-west-1" | "us-west-2" | "us-east-1" | "us-east-2";
function isValidRegion(value: Optional<string | number>): value is Region {
	return ["us-west-1", "us-west-2", "us-east-1", "us-east-2"].includes(String(value));
}

/**
 * Intended for use with @aws-sdk/client-sns
 */
export function getSnsInfo() {
	const topicArn = getFromProcess<string>((value: unknown) => typeof(value) === "string", "snsTopicArn");
	const region = getFromProcess<Region>(isValidRegion, "snsRegion");
	return { topicArn, region };
}