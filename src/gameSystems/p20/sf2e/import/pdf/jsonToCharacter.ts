import { PdfJsonFieldManager, type PdfJson } from "@rsc-utils/io-utils";
import { PathbuilderCharacter, type TPathbuilderCharacter } from "../../../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { getDemiplanePdfKeyMap } from "./keyMap/getDemiplanePdfKeyMap.js";
import { getPlaytestPdfKeyMap } from "./keyMap/getPlaytestPdfKeyMap.js";
import { parseCharacterCore } from "./parseCharacterCore.js";

type Field = { name:string; value:string; } | { name:string; checked:boolean; };

export function jsonToCharacterCore(rawJson: PdfJson): TPathbuilderCharacter | undefined {
	const isDemiplane = rawJson.Pages.some(page => page.Fields.some((field: { id?:{ Id?:string; } }) => field.id?.Id === "character_name"));
	const pdfKeyMap = isDemiplane
		? getDemiplanePdfKeyMap()
		: getPlaytestPdfKeyMap();
	const fieldMapper = isDemiplane
		? (field: Field) => ({ id:pdfKeyMap.get(field.name)?.sageKey, ...field })
		: (field: Field) => ({ id:pdfKeyMap.get(+field.name.replace(/\D/g, ""))?.sageKey, ...field });
	const mgr = new PdfJsonFieldManager(rawJson, fieldMapper);

	// validate that the pdf has all the pdf keys
	if (!mgr.has("name")) return undefined;

	const core = parseCharacterCore(mgr, pdfKeyMap);
	return core ?? undefined;
}

export function jsonToCharacter(rawJson: PdfJson): PathbuilderCharacter | undefined {
	const core = jsonToCharacterCore(rawJson);
	if (core) return new PathbuilderCharacter(core);
	return undefined;
}