// import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
// import { getSesInfo } from "@rsc-utils/core-utils";

// export function notifyOfError(subject: string, content: string) {
// 	const { toAddress, fromAddress, region } = getSesInfo();
// 	const email = new SendEmailCommand({
// 		Source: fromAddress,
// 		Destination: { ToAddresses: [toAddress] },
// 		Message: {
// 			Subject: { Charset: "UTF-8", Data: subject },
// 			Body: { Text: { Charset: "UTF-8", Data: content } }
// 		}
// 	});

// 	const sesClient = new SESClient({ region });
// 	return sesClient.send(email);
// }

import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { getSnsInfo } from "@rsc-utils/core-utils";

export function notifyOfError(subject: string, content: string) {
	const { snsTopicArn } = getSnsInfo();
	const email = new PublishCommand({
		Subject: subject,
		Message: content,
		TopicArn: snsTopicArn
	});

	const sesClient = new SNSClient({ });
	return sesClient.send(email);
}