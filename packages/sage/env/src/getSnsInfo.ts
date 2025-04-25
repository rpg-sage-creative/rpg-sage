import { getCodeName, getFromProcessSafely, type Optional } from "@rsc-utils/core-utils";

type Region = "us-west-1" | "us-west-2" | "us-east-1" | "us-east-2";

type SnsInfo = { accessKeyId:string; secretAccessKey:string; topicArn:string; region:Region; };

type InvalidSnsInfo = Partial<SnsInfo> & { valid:false; };
type ValidSnsInfo = SnsInfo & { valid:true; };

let _snsInfo: InvalidSnsInfo | ValidSnsInfo;

/**
 * Intended for use with @aws-sdk/client-sns
 */
export function getSnsInfo(): SnsInfo | undefined {
	if (!_snsInfo) {
		/** @todo stop checking dev and simply ensure that not having the values in the config/env.json behaves correctly */
		if (getCodeName() === "dev") {
			_snsInfo = { valid:false };
		}else {
			const isValidRegion = (value: Optional<string | number>): value is Region => ["us-west-1", "us-west-2", "us-east-1", "us-east-2"].includes(String(value));

			const accessKeyId = getFromProcessSafely<string>((value: unknown) => typeof(value) === "string", "snsAccessKeyId");
			const secretAccessKey = getFromProcessSafely<string>((value: unknown) => typeof(value) === "string", "snsSecretAccessKey");
			const topicArn = getFromProcessSafely<string>((value: unknown) => typeof(value) === "string", "snsTopicArn");
			const region = getFromProcessSafely<Region>(isValidRegion, "snsRegion");
			const valid = accessKeyId && secretAccessKey && topicArn && region ? true : false;
			_snsInfo = { accessKeyId, secretAccessKey, topicArn, region, valid } as InvalidSnsInfo;
		}
	}
	return _snsInfo.valid ? _snsInfo : undefined;
}