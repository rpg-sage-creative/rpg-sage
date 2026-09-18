import { isNonNilSnowflake, type Snowflake } from "@rsc-utils/id-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { getFromProcess } from "./getFromProcess.js";
import { getFromProcessSafely } from "./getFromProcessSafely.js";
import type { ValidatorArg } from "./types.js";

const _ids: Record<string, Snowflake | null> = { };

export function getId(name: string): Snowflake;
export function getId(name: string, ignoreMissing: boolean): Snowflake | undefined;
export function getId(name: string, ignoreMissing?: boolean): Snowflake | undefined {
	if (!(name in _ids)) {
		const snowflakeValidator = (value: Optional<ValidatorArg>): value is Snowflake => {
			return typeof(value) === "string" && isNonNilSnowflake(value);
		};

		const getter = ignoreMissing ? getFromProcessSafely : getFromProcess;

		_ids[name] = getter<Snowflake>(snowflakeValidator, `${name}Id`) ?? null;
	}
	return _ids[name] ?? undefined;
}