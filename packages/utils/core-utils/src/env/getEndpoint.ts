import { info } from "../console/loggers/info.js";
import type { Optional } from "../types/generics.js";
import { getPort } from "./getPort.js";
import { getFromProcess } from "./internal/getFromProcess.js";

export type AppServerEndpoint = {
	secure: boolean;
	hostname: string;
	port: number;
};

function isValidBoolean(value: Optional<string | number>): value is string {
	const stringValue = String(value);
	return stringValue === "true" || stringValue === "false";
}

function getSecure(name: string): boolean | undefined {
	try {
		const key = `${name.toLowerCase()}Secure`;
		const value = getFromProcess<string>(isValidBoolean, key);
		return value === "true";
	}catch { }
	return undefined;
}

function isValidHostname(value: Optional<string | number>): value is string {
	const stringValue = String(value);
	return /^\d+(\.\d+){3}$/.test(stringValue)
		|| stringValue.includes(".lambda-url.us-west-2.on.aws")
		|| stringValue.includes(".us-west-2.compute.amazonaws.com")
		|| stringValue.includes("localhost");
}

function getHostname(name: string): string | undefined {
	try {
		const key = `${name.toLowerCase()}Hostname`;
		const value = getFromProcess<string>(isValidHostname, key);
		return value;
	}catch { }
	return undefined;
}

const _endpoints: { [key:string]: Partial<AppServerEndpoint>; } = { };

export function getEndpoint(server: string): Partial<AppServerEndpoint> {
	if (!_endpoints[server]) {
		const secure = getSecure(server);
		const hostname = getHostname(server);
		const port = getPort(server);
		const endpoint = { secure, hostname, port };
		_endpoints[server] = endpoint;
		info({ server, ...endpoint });
	}
	return _endpoints[server];
}