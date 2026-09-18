import { isWholeNumberString, type Optional } from "@rsc-utils/type-utils";
import { getFromProcess } from "./getFromProcess.js";
import { getFromProcessSafely } from "./getFromProcessSafely.js";
import type { ValidatorArg } from "./types.js";

const _ports: Record<string, number | null> = { };

/** Gets the port for the server by looking for key: `${server.toLowerCase()}Port` */
export function getPort(server: string): number;
export function getPort(server: string, ignoreMissing: boolean): number | undefined;
export function getPort(server: string, ignoreMissing?: boolean): number | undefined {
	if (!(server in _ports)) {
		const numberValidator = (value: Optional<ValidatorArg>): value is number | `${number}` => {
			if (typeof(value) === "number" || isWholeNumberString(value)) {
				const port = +value!;
				// system ports are 0 - 1023; 65535 is unsigned 16-bit int max
				// https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
				return port > 1023 && port <= 65535;
			}
			return false;
		};

		const getter = ignoreMissing ? getFromProcessSafely : getFromProcess;

		const key = `${server.toLowerCase()}Port`;
		const value = getter<number | `${number}`>(numberValidator, key);
		_ports[server] = value ? +value : null;
	}
	return _ports[server] ?? undefined;
}