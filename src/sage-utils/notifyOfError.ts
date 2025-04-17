import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { getSnsInfo } from "@rsc-sage/env";

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
	const results = await sesClient.send(email).catch(() => undefined);
	return results?.$metadata.httpStatusCode === 200;
}