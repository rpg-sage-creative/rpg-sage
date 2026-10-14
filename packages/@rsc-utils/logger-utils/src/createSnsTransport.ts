import { isSnsClientConfig, sendSns, type SnsClientConfig } from "@rsc-utils/aws-utils";
import { typeError } from "@rsc-utils/error-utils";
import build from "pino-abstract-transport";
import { stringifyPinoLogEntry } from "./stringifyPinoLogEntry.js";
import { toHumanReadableLevel } from "./toHumanReadableLevel.js";

export type SnsTransportOptions = {
	/** all the config settings to send SNS messages */
	clientConfig: SnsClientConfig;
	/** subject for the SNS messages */
	subject: string;
};

// in the event that the SNS starts failing, we don't want to keep spamming failures
let SEND_SNS = false;

/**
 * Creates a Pino transport for sending log entries to AWS SNS.
 * @param options all the values needed for SNS along with
 * @returns
 */
export default function createSnsTransport(options: SnsTransportOptions) {
	// ensure options arg
	if (!options || !("subject" in options) || !("clientConfig" in options)) {
		throw typeError({ argKey:"options", mustBe:"an object: { clientConfig, subject }", value:options });
	}

	const { subject, clientConfig } = options;

	// ensure options.clientConfig is valid
	if (!isSnsClientConfig(clientConfig)) {
		throw typeError({ argKey:"options.clientConfig", mustBe:"an object: { accessKeyId, region, secretAccessKey, topicArn }", value:clientConfig });
	}

	// ensure options.subject is at least a non-empty string
	if (typeof(subject) !== "string" || !subject?.trim()) {
		throw typeError({ argKey:"options.subject", mustBe:"a string", value:subject });
	}

	try {
		SEND_SNS = true;

		return build(async function (source) {
			if (!SEND_SNS) return;
			for await (const log of source) {
				try {
					const content = stringifyPinoLogEntry(log);
					const leveledSubject = options.subject.replaceAll("{level}", toHumanReadableLevel(log.level) ?? "");
					const sent = await sendSns({ clientConfig, content, subject:leveledSubject, });
					if (!sent) {
						console.warn({ level:"warn", args:["SNS Not Sent"], });
						SEND_SNS = false;
						break;
					}

				}catch(err) {
					console.error({ level:"error", args:["Publishing Message Failed", err, log], });
					SEND_SNS = false;
					break;
				}
			}
		});

	}catch(err) {
		console.error({ level:"fatal", args:["Transport Initialization Failed", err], });
		SEND_SNS = false;

		// return empty/noop transport
		return build(() => {});

	}

}