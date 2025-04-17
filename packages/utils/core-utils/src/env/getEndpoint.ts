import { info } from "../console/loggers/info.js";
import type { Optional } from "../types/generics.js";
import { getAwsRegion } from "./getAwsRegion.js";
import { getFromProcessSafely } from "./getFromProcessSafely.js";
import { getPort } from "./getPort.js";
import type { Region } from "./types.js";

export type AppServerEndpoint = {
	secure: boolean;
	hostname: string;
	port: number;

	region?: Region;
	/** does this endpoint have a hostname and port */
	valid: boolean;
};

const _endpoints: { [key:string]: Partial<AppServerEndpoint>; } = { };

export function getEndpoint(server: string): Partial<AppServerEndpoint> {
	if (!_endpoints[server]) {
		const booleanValidator = (value: Optional<string | number>): value is `${boolean}` => {
			return /^(true|false)$/.test(String(value));
		};
		const hostnameValidator = (value: Optional<string | number>, region?: Region): value is string => {
			const stringValue = String(value);
			return /^\d+(\.\d+){3}$/.test(stringValue)
				|| stringValue.includes(`.lambda-url.${region}.on.aws`)
				|| stringValue.includes(`.${region}.compute.amazonaws.com`)
				|| stringValue.includes("localhost");
		};

		const region = getAwsRegion(`${server.toLowerCase()}Region`);
		const secure = getFromProcessSafely<string>(booleanValidator, `${server.toLowerCase()}Secure`) === "true";
		const hostname = getFromProcessSafely<string>(value => hostnameValidator(value, region), `${server.toLowerCase()}Hostname`);
		const port = getPort(server);

		const valid = hostname && port ? true : false;

		const endpoint = { secure, hostname, port, region, valid };
		_endpoints[server] = endpoint;

		info({ server, ...endpoint });
	}
	return _endpoints[server];
}