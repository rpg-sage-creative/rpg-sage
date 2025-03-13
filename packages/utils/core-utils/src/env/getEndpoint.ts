import type { Optional } from "../types";
import { getPort } from "./getPort";
import { getFromProcess } from "./internal";

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
	return stringValue.includes(".lambda-url.us-west-2.on.aws")
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

export function getEndpoint(server: string): Partial<AppServerEndpoint> {
	const secure = getSecure(server);
	const hostname = getHostname(server);
	const port = getPort(server);
	return { secure, hostname, port };
}