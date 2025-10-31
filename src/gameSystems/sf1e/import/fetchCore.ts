import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { fetchCores as fetchAll, fetchJsonCore, fetchCore as fetchOne, type FetchResult } from "../../utils/io/fetchCores.js";
import { HephaistosCharacterSF1e } from "../characters/HephaistosCharacter.js";
import { validCoreOrUndefined } from "./hephaistos/validCoreOrUndefined.js";
import type { HephaistosCharacterCoreSF1e } from "./types.js";

function createHandlers() {
	return {
		char: (core: HephaistosCharacterCoreSF1e) => new HephaistosCharacterSF1e(core),
		pdf: () => undefined,
		raw: (json: unknown) => validCoreOrUndefined(json),
	};
}

/** Uses id="" from the import command as Pathbuilder's "Export JSON" id. */
async function fetchById(sageCommand: SageCommand): Promise<FetchResult<HephaistosCharacterCoreSF1e> | undefined> {
	const id = sageCommand.args.getNumber("id");
	if (id) {
		fetchJsonCore;
		// const exportUrl = `https://pathbuilder2e.com/json.php?id=${id}`;
		// const coreOrError = await fetchJsonCore(exportUrl, "INVALID_ID", createHandlers());
		// return { id, ...coreOrError };
	}
	return undefined;
}

export async function fetchCore(sageCommand: SageCommand): Promise<FetchResult<HephaistosCharacterCoreSF1e> | undefined> {
	return (await fetchById(sageCommand))
		?? fetchOne(sageCommand, createHandlers());
}

export async function fetchCores(sageCommand: SageCommand): Promise<FetchResult<HephaistosCharacterCoreSF1e>[]> {
	const results: FetchResult<HephaistosCharacterCoreSF1e>[] = [];

	const byId = await fetchById(sageCommand);
	if (byId) {
		results.push(byId);
	}

	results.push(...await fetchAll(sageCommand, createHandlers()));

	return results;
}
