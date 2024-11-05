import { PlayerCharacterJoe } from "../../../sage-e20/joe/PlayerCharacterJoe.js";
import { PlayerCharacterPR } from "../../../sage-e20/pr/PlayerCharacterPR.js";
import { PlayerCharacterTransformer } from "../../../sage-e20/transformer/PlayerCharacterTransformer.js";
import type { TEssence20CharacterCore } from "../../../sage-lib/sage/commands/e20.js";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import { fetchCores as fetchAll, fetchCore as fetchOne, type FetchResult } from "../../utils/fetchCore.js";
import { jsonToCharacterCore } from "./pdf/jsonToCharacter.js";

function createHandlers() {
	return {
		char: (core: TEssence20CharacterCore) => {
			switch(core.gameType) {
				case "E20 - G.I. Joe": return new PlayerCharacterJoe(core);
				case "E20 - Power Rangers": return new PlayerCharacterPR(core);
				case "E20 - Transformers": return new PlayerCharacterTransformer(core);
			}
		},
		pdf: jsonToCharacterCore,
		raw: () => undefined,
	};
}

export async function fetchCore(sageCommand: SageCommand): Promise<FetchResult<TEssence20CharacterCore>> {
	return fetchOne(sageCommand, createHandlers());
}

export async function fetchCores(sageCommand: SageCommand): Promise<FetchResult<TEssence20CharacterCore>[]> {
	return fetchAll(sageCommand, createHandlers());
}
