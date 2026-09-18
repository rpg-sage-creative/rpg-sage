import { NIL_UUID, MAX_UUID, generateUuid } from "../../build/index.js";

const uuid = generateUuid();

/** [ [input, isUuidResult, isNilUuidResult, isNonNilUuidResult, orNilUuidResult], ... ]  */
const tests = [
	{ input:NIL_UUID, isUuidResult:true, isNilUuidResult:true, isMaxUuidResult:false, isNonNilUuidResult:false, orNilUuidResult:NIL_UUID },
	{ input:MAX_UUID, isUuidResult:true, isNilUuidResult:false, isMaxUuidResult:true, isNonNilUuidResult:true, orNilUuidResult:MAX_UUID },
	{ input:uuid, isUuidResult:true, isNilUuidResult:false, isMaxUuidResult:false, isNonNilUuidResult:true, orNilUuidResult:uuid },
	{ input:"control", isUuidResult:false, isNilUuidResult:false, isMaxUuidResult:false, isNonNilUuidResult:false, orNilUuidResult:NIL_UUID },
];

export function getTests(which) {
	return { uuid, tests };
}