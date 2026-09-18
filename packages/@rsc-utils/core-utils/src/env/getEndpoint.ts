import { parseBoolean, type Optional } from "@rsc-utils/type-utils";
import { getAwsRegion } from "./getAwsRegion.js";
import { getFromProcessSafely } from "./getFromProcessSafely.js";
import { getPort } from "./getPort.js";
import type { Region, ValidatorArg } from "./types.js";

export type AppServerEndpoint = {
	secure: boolean;
	hostname: string;
	port: number;

	region?: Region;
	/** does this endpoint have a hostname and port */
	valid: boolean;
};

const _endpoints: Record<string, Partial<AppServerEndpoint>> = { };

export function getEndpoint(server: string): Partial<AppServerEndpoint> {
	if (!_endpoints[server]) {
		const booleanValidator = (value: Optional<ValidatorArg>): value is boolean | `${boolean}` => {
			return parseBoolean(value) !== undefined;
		};
		const hostnameValidator = (value: Optional<ValidatorArg>, region?: Region): value is string => {
			const stringValue = String(value);
			return /^\d+(\.\d+){3}$/.test(stringValue)
				|| stringValue.includes(`.lambda-url.${region}.on.aws`)
				|| stringValue.includes(`.${region}.compute.amazonaws.com`)
				|| stringValue.includes("localhost");
		};

		const serverLower = server.toLowerCase();

		const region = getAwsRegion(`${serverLower}Region`);
		const secure = parseBoolean(getFromProcessSafely(booleanValidator, `${serverLower}Secure`));
		const hostname = getFromProcessSafely<string>(value => hostnameValidator(value, region), `${serverLower}Hostname`);
		const port = getPort(server, true);

		const valid = hostname && port ? true : false;

		const endpoint = { secure, hostname, port, region, valid };
		_endpoints[server] = endpoint;
	}
	return _endpoints[server];
}