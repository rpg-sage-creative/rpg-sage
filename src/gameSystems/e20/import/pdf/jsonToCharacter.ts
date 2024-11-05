import { PdfJsonManager, type PdfJson } from "@rsc-utils/io-utils";
import { PdfJsonParserJoe } from "../../../../sage-e20/joe/parse.js";
import { PdfJsonParserPR } from "../../../../sage-e20/pr/parse.js";
import { PdfJsonParserTransformer } from "../../../../sage-e20/transformer/parse.js";
import type { TEssence20CharacterCore } from "../../../../sage-lib/sage/commands/e20.js";

export function jsonToCharacterCore(rawJson: PdfJson): TEssence20CharacterCore | undefined {
	const pdfJsonManager = PdfJsonManager.from(rawJson);
	if (PdfJsonParserJoe.isJoePdf(pdfJsonManager)) {
		const core = PdfJsonParserJoe.parseCharacter(pdfJsonManager);
		return core ?? undefined;
	}
	if (PdfJsonParserPR.isPowerRangerPdf(pdfJsonManager)) {
		const core = PdfJsonParserPR.parseCharacter(pdfJsonManager);
		return core ?? undefined;
	}
	if (PdfJsonParserTransformer.isTransformerPdf(pdfJsonManager)) {
		const core = PdfJsonParserTransformer.parseCharacter(pdfJsonManager);
		return core ?? undefined;
	}
	return undefined;
}