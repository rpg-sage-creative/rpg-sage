import { getBotCodeName } from "./getBotCodeName.js";
import { getFromProcessArgv } from "./internal/getFromProcessArgv.js";
import { getFromProcessEnv } from "./internal/getFromProcessEnv.js";
import { logAndReturn } from "./internal/logAndReturn.js";
import { Server } from "./Server.js";

function getKey(server: Server): string {
	const prefix = Server[server].toLowerCase();
	return prefix + "Port";
}

function isValid(value: string | number | null | undefined): value is string {
	return /^\d+$/.test(String(value));
}

function getBotDelta(): number {
	const bot = getBotCodeName();
	switch(bot) {
		case "stable":
			return 0;
		case "beta":
			return 10;
		// case "dev":
		default:
			return 100;
	}
}

function getDefaultPort(server: Server): number {
	const base = 3000;
	const botDelta = getBotDelta();
	const serverDelta = server as number;
	const value = base + botDelta + serverDelta;
	return logAndReturn(`${getKey(server)}=${base}+${botDelta}+${serverDelta}`, value);
}

function getPortOrDefault(server: Server): number {
	const key = getKey(server);

	const envValue = getFromProcessEnv(key);
	if (isValid(envValue)) {
		return logAndReturn(key, +envValue);
	}

	const argValue = getFromProcessArgv(key);
	if (isValid(argValue)) {
		return logAndReturn(key, +argValue);
	}

	return getDefaultPort(server);
}

const _ports: number[] = [];

export function getPort(server: Server): number;
export function getPort(server: keyof typeof Server): number;
export function getPort(server: Server | keyof typeof Server): number {
	const serverValue = typeof(server) === "number" ? server : Server[server];
	if (!_ports[serverValue]) {
		_ports[serverValue] = getPortOrDefault(serverValue);
	}
	return _ports[serverValue];
}