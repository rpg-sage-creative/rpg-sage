import { isNonNilSnowflake } from "../snowflake/isNonNilSnowflake.js";
import type { Snowflake } from "../snowflake/types.js";
import type { Optional } from "../types/generics.js";
import { getFromProcess } from "./internal/getFromProcess.js";

function isValid(value: Optional<string | number>): value is Snowflake {
	return isNonNilSnowflake(String(value));
}

const _ids: { [key:string]:Snowflake; } = { };

export function getId(name: string): Snowflake {
	if (!_ids[name]) {
		_ids[name] = getFromProcess(isValid, `${name}Id`);
	}
	return _ids[name];
}