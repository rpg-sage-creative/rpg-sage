import { isNonNilSnowflake } from "../snowflake/isNonNilSnowflake.js";
import type { Snowflake } from "../snowflake/types.js";
import type { Optional } from "../types/generics.js";
import { getFromProcess } from "./getFromProcess.js";

const _ids: { [key:string]:Snowflake; } = { };

export function getId(name: string): Snowflake {
	if (!_ids[name]) {
		const snowflakeValidator = (value: Optional<string | number>): value is Snowflake => {
			return isNonNilSnowflake(String(value));
		};

		_ids[name] = getFromProcess(snowflakeValidator, `${name}Id`);
	}
	return _ids[name];
}