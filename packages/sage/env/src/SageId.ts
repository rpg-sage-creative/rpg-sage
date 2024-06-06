import type { Snowflake } from "@rsc-utils/core-utils";

let _sageId: Snowflake;
export function setSageId(sageId: Snowflake): void {
	_sageId = sageId;
}

export function getSageId(): Snowflake {
	return _sageId;
}

export function hasSageId(): boolean {
	return !!_sageId;
}

export function isSageId(id?: Snowflake | null): id is Snowflake {
	return _sageId && id ? _sageId === id : false;
}