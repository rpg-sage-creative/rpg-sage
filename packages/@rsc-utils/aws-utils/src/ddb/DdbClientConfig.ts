// import { isUrl } from "../../url/isUrl.js";
// import type { VALID_URL } from "../../url/types.js";
import { isAwsRegion, type AwsRegion } from "../AwsRegion.js";

/** A valid URL starts with http:// or https:// */
export type VALID_URL = string & { valid_url:never; };

/** @todo replace this function and the VALID_URL type with proper references when they are extracted from io-utils */
function isUrl(value: unknown): value is VALID_URL {
	return typeof(value) === "string"
		&& (value.startsWith("http://") || value.startsWith("https://"));
}

export type DdbClientConfig = {
	/** "ddbAccessKeyId":"" */
	accessKeyId: string;
	/** "ddbEndpoint":"" */
	endpoint: VALID_URL;
	/** "ddbRegion":"" */
	region: AwsRegion;
	/** "ddbSecretAccessKey":"" */
	secretAccessKey: string;
};

export function isDdbClientConfig(config: unknown): config is DdbClientConfig {
	return typeof(config) === "object" && config !== null
		&& "accessKeyId" in config && typeof(config.accessKeyId) === "string"
		&& "endpoint" in config && isUrl(config.endpoint)
		&& "region" in config && isAwsRegion(config.region)
		&& "secretAccessKey" in config && typeof(config.secretAccessKey) === "string"
		;
}