import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { getSnsInfo } from "@rsc-sage/env";
import { warnReturnUndefined } from "@rsc-utils/core-utils";

/** If SNS info is found in the env, then the subject/content are sent to SNS. */
export async function notifyOfError(subject: string, content: string): Promise<boolean> {
	const snsInfo = getSnsInfo();
	if (!snsInfo) {
		return false;
	}

	const { accessKeyId, secretAccessKey, topicArn, region } = snsInfo;

	const email = new PublishCommand({
		Subject: subject,
		Message: content,
		TopicArn: topicArn
	});

	const sesClient = new SNSClient({ region, credentials:{ accessKeyId, secretAccessKey } });
	const results = await sesClient.send(email).catch(warnReturnUndefined);
	return results?.$metadata.httpStatusCode === 200;
}