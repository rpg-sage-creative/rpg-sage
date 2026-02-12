import { getFromProcessSafely, type Optional } from "@rsc-utils/core-utils";

type Region = "us-west-1" | "us-west-2" | "us-east-1" | "us-east-2";

type SnsInfo = {
	/** "snsAccessKeyId":"" */
	accessKeyId: string;
	/** "snsSecretAccessKey":"" */
	secretAccessKey: string;
	/** "snsTopicArn":"" */
	topicArn: string;
	/** "snsRegion":"" */
	region: Region;
};

type InvalidSnsInfo = Partial<SnsInfo> & { valid:false; };
type ValidSnsInfo = SnsInfo & { valid:true; };

let _snsInfo: InvalidSnsInfo | ValidSnsInfo;

/**
 * Retreives the sns information from the env.json runtime config file.
 * All four keys must be present in the env.json file.
 * Region is limited to: "us-west-1", "us-west-2", "us-east-1", "us-east-2".
 * Intended for use with @aws-sdk/client-sns
 */
export function getSnsInfo(): SnsInfo | undefined {
	if (!_snsInfo) {
		const isValidRegion = (value: Optional<string | number>): value is Region => ["us-west-1", "us-west-2", "us-east-1", "us-east-2"].includes(String(value));
		const isString = (value: unknown) => typeof(value) === "string";

		const accessKeyId = getFromProcessSafely<string>(isString, "snsAccessKeyId");
		const secretAccessKey = getFromProcessSafely<string>(isString, "snsSecretAccessKey");
		const topicArn = getFromProcessSafely<string>(isString, "snsTopicArn");
		const region = getFromProcessSafely<Region>(isValidRegion, "snsRegion");

		// We only try to use this if all the keys are present
		const valid = accessKeyId && secretAccessKey && topicArn && region ? true : false;
		_snsInfo = { accessKeyId, secretAccessKey, topicArn, region, valid } as InvalidSnsInfo;
	}
	return _snsInfo.valid ? _snsInfo : undefined;
}