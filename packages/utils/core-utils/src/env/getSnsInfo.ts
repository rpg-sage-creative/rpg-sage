import { getFromProcess } from "./internal/getFromProcess.js";

/**
 * Intended for use with @aws-sdk/client-sns
 */
export function getSnsInfo() {
	const snsTopicArn = getFromProcess<string>((value: unknown) => typeof(value) === "string", "snsTopicArn");
	return { snsTopicArn };
}