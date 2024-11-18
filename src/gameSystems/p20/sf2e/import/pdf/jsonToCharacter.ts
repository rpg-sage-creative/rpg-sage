import { PdfJsonFieldManager, type PdfJson } from "@rsc-utils/io-utils";
import type { Field } from "@rsc-utils/io-utils/src/pdf/internal/types.js";
import { PathbuilderCharacter } from "../../../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import type { PathbuilderCharacterCore } from "../../../import/pathbuilder-2e/types.js";
import { getWanderersGuidePdfKeyMap } from "../../../import/wanderers-guide/getWanderersGuidePdfKeyMap.js";
import { getDemiplanePdfKeyMap } from "./keyMap/getDemiplanePdfKeyMap.js";
import { getPlaytestPdfKeyMap } from "./keyMap/getPlaytestPdfKeyMap.js";
import { parseCharacterCore } from "./parseCharacterCore.js";
import type { PdfKeyMap } from "./types.js";

type HasId = { id?:string | number; };
type TransmutedField = Field & HasId;
type Transmuter = (fields: Field) => TransmutedField;

type PdfType = "pf2e-wanderers-guide" | "sf2e-demiplane" | "sf2e-playtest";

type PdfKeyMapData = {
	pdfKeyMap: PdfKeyMap;
	pdfType: PdfType;
	transmuter: Transmuter;
};

function getSf2eDemiplaneData(): PdfKeyMapData {
	const pdfKeyMap = getDemiplanePdfKeyMap();
	const transmuter = (field: Field) => ({ id:pdfKeyMap.get(field.name)?.sageKey, ...field });
	return { pdfKeyMap, pdfType: "sf2e-demiplane", transmuter };
}

function getPf2eWanderersGuideData(): PdfKeyMapData {
	const pdfKeyMap = getWanderersGuidePdfKeyMap();
	const transmuter = (field: Field) => ({ id:pdfKeyMap.get(field.name)?.sageKey, ...field });
	return { pdfKeyMap, pdfType: "pf2e-wanderers-guide", transmuter };
}

function getSf2ePlaytestData(): PdfKeyMapData {
	const pdfKeyMap = getPlaytestPdfKeyMap();
	const transmuter = (field: Field) => ({ id:pdfKeyMap.get(+field.name.replace(/\D/g, ""))?.sageKey, ...field });
	return { pdfKeyMap, pdfType: "sf2e-playtest", transmuter };
}

/**
 * Looks for field ids that are known to be unique to a specific pdf.
 * Returns the PdfKeyMapData associated with the uniquely identified pdf.
 * If one isn't found, the default SF2e Playtest PdfKeyMapData is returned.
 */
function guessPdfType(rawJson: PdfJson): PdfKeyMapData {
	for (const page of rawJson.Pages) {
		for (const field of page.Fields) {
			switch(field.id?.Id) {
				case "character_name": return getSf2eDemiplaneData();
				case "Character_Name": return getPf2eWanderersGuideData();
				default: break;
			}
		}
	}
	return getSf2ePlaytestData();
}

export function jsonToCharacterCore(rawJson: PdfJson): PathbuilderCharacterCore | undefined {
	const { pdfKeyMap, transmuter } = guessPdfType(rawJson);
	const mgr = new PdfJsonFieldManager(rawJson, transmuter);

	// validate that the pdf has all the pdf keys
	if (!mgr.has("name")) {
		return undefined;
	}
	// for (const key of pdfKeyMap.keys()) {
	// 	if (!mgr.has(key)) {
	// 		return undefined;
	// 	}
	// }

	const core = parseCharacterCore(mgr, pdfKeyMap);
	return core ?? undefined;
}

export function jsonToCharacter(rawJson: PdfJson): PathbuilderCharacter | undefined {
	const core = jsonToCharacterCore(rawJson);
	return core ? new PathbuilderCharacter(core) : undefined;
}