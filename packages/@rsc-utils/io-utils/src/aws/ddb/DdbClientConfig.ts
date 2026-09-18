import { isUrl } from "../../url/isUrl.js";
import type { VALID_URL } from "../../url/types.js";
import { isAwsRegion, type AwsRegion } from "../AwsRegion.js";

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