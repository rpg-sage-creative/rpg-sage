import { isAwsRegion, type AwsRegion } from "../AwsRegion.js";

export type SnsClientConfig = {
	/** "snsAccessKeyId":"" */
	accessKeyId: string;
	/** "snsRegion":"" */
	region: AwsRegion;
	/** "snsSecretAccessKey":"" */
	secretAccessKey: string;
	/** "snsTopicArn":"" */
	topicArn: string;
};

export function isSnsClientConfig(config: unknown): config is SnsClientConfig {
	return typeof(config) === "object" && config !== null
		&& "accessKeyId" in config && typeof(config.accessKeyId) === "string"
		&& "region" in config && isAwsRegion(config.region)
		&& "secretAccessKey" in config && typeof(config.secretAccessKey) === "string"
		&& "topicArn" in config && typeof(config.topicArn) === "string"
		;
}