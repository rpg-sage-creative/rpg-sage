import { existsSync } from "fs";
import { getFromProcess } from "./internal/getFromProcess";

function isValid(value: string | number | null | undefined): value is string {
	return !!value && existsSync(String(value));
}

let _dataRootFoundry: string;
export function getDataRootFoundry(): string {
	if (!_dataRootFoundry) {
		_dataRootFoundry = getFromProcess(isValid, "dataRootFoundry");
	}
	return _dataRootFoundry;
}
