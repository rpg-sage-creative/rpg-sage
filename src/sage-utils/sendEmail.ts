import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { getSesInfo } from "@rsc-utils/core-utils";

export function sendEmail(subject: string, content: string) {
	const { toAddress, fromAddress, region } = getSesInfo();
	const email = new SendEmailCommand({
		Source: fromAddress,
		Destination: { ToAddresses: [toAddress] },
		Message: {
			Subject: { Charset: "UTF-8", Data: subject },
			Body: { Text: { Charset: "UTF-8", Data: content } }
		}
	});

	const sesClient = new SESClient({ region });
	return sesClient.send(email);
}