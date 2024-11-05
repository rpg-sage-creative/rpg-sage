import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { PathbuilderCharacter, type TPathbuilderCharacter } from "../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { fetchCores as fetchAll, fetchJsonCore, fetchCore as fetchOne, type FetchResult } from "../../utils/fetchCore.js";
import { jsonToCharacterCore } from "../sf2e/import/pdf/jsonToCharacter.js";
import { validCoreOrUndefined } from "./pathbuilder-2e/validCoreOrUndefined.js";
import { wanderersGuideToPathbuilderJson } from "./wanderers-guide/wanderersGuideToPathbuilderJson.js";

function createHandlers() {
	return {
		char: (core: TPathbuilderCharacter) => new PathbuilderCharacter(core),
		pdf: jsonToCharacterCore,
		raw: (json: unknown) => validCoreOrUndefined(json) ?? wanderersGuideToPathbuilderJson(json),
	};
}

/** Uses id="" from the import command as Pathbuilder's "Export JSON" id. */
async function fetchById(sageCommand: SageCommand): Promise<FetchResult<TPathbuilderCharacter>[]> {
	const results: FetchResult<TPathbuilderCharacter>[] = [];
	const id = sageCommand.args.getNumber("id");
	if (id) {
		const exportUrl = `https://pathbuilder2e.com/json.php?id=${id}`;
		const coreOrError = await fetchJsonCore(exportUrl, "INVALID_ID", createHandlers());
		results.push({ id, ...coreOrError });
	}
	return results;
}

export async function fetchCore(sageCommand: SageCommand): Promise<FetchResult<TPathbuilderCharacter>> {
	const byId = await fetchById(sageCommand);
	if (byId.length) return byId[0];
	return fetchOne(sageCommand, createHandlers());
}

export async function fetchCores(sageCommand: SageCommand): Promise<FetchResult<TPathbuilderCharacter>[]> {
	const results: FetchResult<TPathbuilderCharacter>[] = [];
	results.push(...await fetchById(sageCommand));
	results.push(...await fetchAll(sageCommand, createHandlers()));
	return results;
}
