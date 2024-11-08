import type { TPathbuilderCharacter } from "../../../../sage-pf2e/model/pc/PathbuilderCharacter";

type TPathbuilderJson = {
	success: boolean;
	build: TPathbuilderCharacter;
};

function isValidCore(json: unknown): json is TPathbuilderCharacter;
function isValidCore(json: any): boolean {
	if (json) {
		return [
			"name",
			"class",
			"level",
			"ancestry",
			"heritage",
			"background",
			"size",

			"attributes", // ?

			"abilities",
			"proficiencies",

			"weapons",
			"money",
			"armor",
			// "acTotal", // hephaistos is missing this
		].every(key => {
			const isPresent = key in json;
			// debug({key,isPresent});
			return isPresent;
		});
	}
	return false;
}

function isValidJson(json: unknown): json is TPathbuilderJson;
function isValidJson(json: any): boolean {
	if (json) {
		return "success" in json
			&& "build" in json
			&& isValidCore(json.build);
	}
	return false;
}

export function validCoreOrUndefined(json: unknown): TPathbuilderCharacter | undefined {
	if (isValidCore(json)) return json;
	if (isValidJson(json)) return json.build;
	return undefined;
}