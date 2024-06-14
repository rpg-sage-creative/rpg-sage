import type { Optional } from "../types/generics.js";
import { getCodeName } from "./getCodeName.js";
import { getFromProcess } from "./internal/getFromProcess.js";
import { logAndReturn } from "./internal/logAndReturn.js";

function isValid(value: Optional<string | number>): value is string {
	return /^\d+$/.test(String(value));
}

function getByName(name: string): number {
	const key = `${name.toLowerCase()}Port`;
	const value = getFromProcess<string>(isValid, key);
	return +value;
}

function getBotDelta(): number {
	const bot = getCodeName();
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

function getByIndex(serverIndex: number): number {
	const base = 3000;
	const botDelta = getBotDelta();
	const value = base + botDelta + serverIndex;
	return logAndReturn(`Port(${serverIndex})=${base}+${botDelta}+${serverIndex}`, value);
}

const _ports: { [key:string|number]: number; } = { };

export function getPort(server: string | number): number {
	if (!_ports[server]) {
		if (typeof(server) === "string") {
			_ports[server] = getByName(server);
		}else {
			_ports[server] = getByIndex(server);
		}
	}
	return _ports[server];
}