import { parseJson } from "@rsc-utils/core-utils";
import { getJson } from "@rsc-utils/io-utils";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { coreToResult, fetchCores as fetchAll, fetchCore as fetchOne, type FetchCoreResult, type FetchResult, type ImportHandlers } from "../../utils/io/fetchCores.js";
import type { FetchResultError } from "../../utils/io/handleImportErrors.js";
import { HephaistosCharacterSF1e } from "../characters/HephaistosCharacter.js";
import { validCoreOrUndefined } from "./hephaistos/validCoreOrUndefined.js";
import type { HephaistosCharacterCoreSF1e } from "./types.js";

/*
All of these begin with `https://hephaistos.azurewebsites.net/character/`, just append the numbers after that. All of these are level 1.

- **Navasi, Human Outlaw Envoy:** 1750278754
- **Quig, Ysoki Bounty Hunter Mechanic:** 1241025656
- **Keskodai, Shirren Priest Mystic:** 2037614502
- **Iseph, Android Ace Pilot Operative:** 490769591
- **Altronus, Kasatha Scholar Solarian:** 1628066886
- **Obozaya, Vesk Mercenary Soldier:** 2139833824
- **Raia, Lashunta Xenoseeker Technomancer:** 1282313074

*/

function createHandlers(): ImportHandlers<HephaistosCharacterCoreSF1e> {
	return {
		char: (core: HephaistosCharacterCoreSF1e) => new HephaistosCharacterSF1e(core),
		pdf: () => undefined,
		raw: (json: unknown) => validCoreOrUndefined(json),
	};
}

type FetchedJson = { data: { characters:{ json:string; }[]; }; };

async function fetchJsonCore(id: string, error: FetchResultError, handlers: ImportHandlers<HephaistosCharacterCoreSF1e>): Promise<FetchCoreResult<HephaistosCharacterCoreSF1e>> {
	const postData = {"query":`{\n\tcharacters(readOnlyPermalinkId: "${id}") {\n\t\tjson\n\t}\n}`};
	const fetchedJson = await getJson<FetchedJson>("https://hephaistos.online/query", postData).catch(() => undefined);
	if (!fetchedJson) {
		return { error };
	}

	const stringified = fetchedJson.data?.characters?.[0]?.json;
	if (!stringified) {
		return { error };
	}

	const json = parseJson(stringified);

	const core = handlers.raw(json);
	if (core) {
		return coreToResult(core, handlers.char);
	}

	return { error:"UNSUPPORTED_JSON" };
}

/** Uses id="" from the import command as Pathbuilder's "Export JSON" id. */
async function fetchById(sageCommand: SageCommand): Promise<FetchResult<HephaistosCharacterCoreSF1e> | undefined> {
	const id = sageCommand.args.getString("hephaistos-id") ?? sageCommand.args.getString("id");
	if (id) {
		const coreOrError = await fetchJsonCore(id, "INVALID_ID", createHandlers());
		return { id, ...coreOrError };
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
