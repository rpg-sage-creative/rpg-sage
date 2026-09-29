import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { warnReturnUndefined } from "@rsc-utils/core-utils";
import type { SnsClientConfig } from "./SnsClientConfig.js";

type Args = {
	clientConfig: SnsClientConfig;
	content: string;
	subject: string;
};

/** If SNS info is found in the env, then the subject/content are sent to SNS. */
export async function sendSns({ clientConfig, content, subject }: Args): Promise<boolean> {
	const { topicArn, region, ...credentials } = clientConfig;

	const snsClient = new SNSClient({
		region,
		credentials
	});

	const command = new PublishCommand({
		Subject: subject,
		Message: content,
		TopicArn: topicArn
	});

	const response = await snsClient.send(command).catch(warnReturnUndefined);

	return response?.$metadata.httpStatusCode === 200;
}