import { getFromProcessSafely } from "@rsc-utils/core-utils";
import { isSnsClientConfig, type SnsClientConfig } from "@rsc-utils/io-utils";

type InvalidSnsClientConfig = Partial<SnsClientConfig> & { valid:false; };
type ValidSnsClientConfig = SnsClientConfig & { valid:true; };

let _snsClientConfig: InvalidSnsClientConfig | ValidSnsClientConfig;

/**
 * Retreives the sns information from the env.json runtime config file.
 * All four keys must be present in the env.json file.
 * Region is limited to: "us-west-1", "us-west-2", "us-east-1", "us-east-2".
 * Intended for use with @aws-sdk/client-sns
 */
export function getSnsClientConfig(): SnsClientConfig | undefined {
	if (!_snsClientConfig) {
		const isString = (value: unknown) => typeof(value) === "string";

		const accessKeyId = getFromProcessSafely<string>(isString, "snsAccessKeyId");
		const region = getFromProcessSafely<string>(isString, "snsRegion");
		const secretAccessKey = getFromProcessSafely<string>(isString, "snsSecretAccessKey");
		const topicArn = getFromProcessSafely<string>(isString, "snsTopicArn");

		const config = { accessKeyId, region, secretAccessKey, topicArn };
		_snsClientConfig = { ...config, valid:isSnsClientConfig(config) } as InvalidSnsClientConfig;
	}
	return _snsClientConfig.valid === true ? _snsClientConfig : undefined;
}