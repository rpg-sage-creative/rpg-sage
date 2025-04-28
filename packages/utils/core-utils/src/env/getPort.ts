import type { Optional } from "../types/generics.js";
import { getFromProcess } from "./getFromProcess.js";

const _ports: { [key:string|number]: number; } = { };

export function getPort(server: string): number {
	if (!_ports[server]) {
		const numberValidator = (value: Optional<string | number>): value is `${number}` => {
			return /^\d+$/.test(String(value));
		};

		const key = `${server.toLowerCase()}Port`;
		const value = getFromProcess<string>(numberValidator, key);
		_ports[server] = +value;
	}
	return _ports[server];
}