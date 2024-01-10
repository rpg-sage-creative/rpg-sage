import { existsSync } from "fs";
import { getFromProcess } from "./internal/getFromProcess";

function isValid(value: string | number | null | undefined): value is string {
	return !!value && existsSync(String(value));
}

let _dataRoot: string;
export function getDataRoot(which: "sage" | "pf2e" | "foundry"): string {
	if (!_dataRoot) {
		_dataRoot = getFromProcess(isValid, "dataRoot");
	}
	return `${_dataRoot}/${which}`;
}
