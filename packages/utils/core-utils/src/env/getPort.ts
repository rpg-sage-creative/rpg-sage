import type { Optional } from "../types/generics.js";
import { getFromProcess } from "./getFromProcess.js";
import { getFromProcessSafely } from "./getFromProcessSafely.js";

const _ports: { [key:string|number]: number; } = { };

export function getPort(server: string, ignoreMissing?: boolean): number {
	if (!_ports[server]) {
		const numberValidator = (value: Optional<string | number>): value is `${number}` => {
			return /^\d+$/.test(String(value));
		};

		const getter = ignoreMissing ? getFromProcessSafely : getFromProcess;

		const key = `${server.toLowerCase()}Port`;
		const value = getter<string>(numberValidator, key);
		_ports[server] = value ? +value : 0;
	}
	return _ports[server];
}