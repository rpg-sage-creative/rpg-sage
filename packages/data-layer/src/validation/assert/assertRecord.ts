import { debug } from "@rsc-utils/core-utils";
import { tagFailure } from "../index.js";
import type { AssertArgs } from "./types.js";

type AssertRecordArgs<Core, Type> = AssertArgs<Core, Type> & {
	enforceKeyAsId?: boolean;
};

export function assertRecord<Core, Type>(args: AssertRecordArgs<Core, Type>): boolean {
	const { asserter, core, enforceKeyAsId, key, objectType, optional, validator } = args;

	if (key in (core as Record<string, any>)) {
		const record = core[key] ?? undefined;
		if (typeof(record) !== "object") {
			return tagFailure`${objectType}: invalid record (${key} === ${record})`;
		}
		if (asserter) {
			const failed = Object.values(record).find(val => !asserter({ core:val, objectType }));
			if (failed) {
				return tagFailure`${objectType}: invalid record item(s) asserter:${asserter.name} (${key} === ${record})`;
			}
		}else if (validator) {
			const failed = Object.values(record).find(val => !validator(val));
			if (failed) {
				if (validator.name === "assertSageCharacterCore") debug(failed);
				return tagFailure`${objectType}: invalid array item(s) validator:${validator.name} (${key} === ${record})`;
			}
		}else {
			throw new Error("assertArray(args); args missing asserter AND validator");
		}
		if (enforceKeyAsId) {
			const failed = Object.entries(record).find(([key, val]) => key !== val.id);
			if (failed) {
				return tagFailure`${objectType}: mismatched record (${key}) key and id (${record})`;
			}
		}

	}else if (!optional) {
		return tagFailure`${objectType}: missing required array (${key})`;
	}

	return true;
}