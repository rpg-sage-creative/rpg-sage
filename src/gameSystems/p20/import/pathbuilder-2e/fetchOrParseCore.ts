import { parseReference, type MessageOrPartial } from "@rsc-utils/discord-utils";
import { getJson, PdfCacher, type PdfJson } from "@rsc-utils/io-utils";
import type { SageCommand } from "../../../../sage-lib/sage/model/SageCommand.js";
import { type TPathbuilderCharacter } from "../../../../sage-pf2e/model/pc/PathbuilderCharacter.js";
import { jsonToCharacterCore } from "../../sf2e/import/pdf/jsonToCharacter.js";
import { pathbuildeCoreOrUndefined } from "../wanderers-guide/pathbuildeCoreOrUndefined.js";
import { validCoreOrUndefined } from "./validCoreOrUndefined.js";

type ResultError = "INVALID_EXPORT_JSON_ID"
	| "INVALID_JSON_URL" | "INVALID_JSON_ATTACHMENT" | "INVALID_JSON"
	| "INVALID_PDF_URL" | "INVALID_PDF_ATTACHMENT" | "INVALID_PDF";
type Result = {
	core?: TPathbuilderCharacter;
	error?: ResultError;

	exportJsonId?: number;
	/** name of the attachment parsed */
	attachmentName?: string;
	/** url to the json file or json attachment */
	jsonUrl?: string;
	/** url to the pdf file or pdf attachment */
	pdfUrl?: string;
}

type FetchCoreResult = {
	core?: TPathbuilderCharacter;
	error?: ResultError;
};
async function fetchJsonCore(jsonUrl: string, error: ResultError): Promise<FetchCoreResult> {
	const json = await getJson(jsonUrl);
	if (!json) return { error };

	const core = validCoreOrUndefined(json)
		?? pathbuildeCoreOrUndefined(json);
	if (core) return { core };

	return { error:"INVALID_JSON" };
}
async function fetchPdfCore(pdfUrl: string, error: ResultError): Promise<FetchCoreResult> {
	const pdfJson = await PdfCacher.read<PdfJson>(pdfUrl);
	if (!pdfJson) return { error };

	const core = jsonToCharacterCore(pdfJson);
	if (core) return { core };

	return { error:"INVALID_PDF" };
}


/** Uses id="" from the import command as Pathbuilder's "Export JSON" id. */
async function fetchById(sageCommand: SageCommand): Promise<Result[]> {
	const results: Result[] = [];
	const exportJsonId = sageCommand.args.getNumber("id");
	if (exportJsonId) {
		const exportUrl = `https://pathbuilder2e.com/json.php?id=${exportJsonId}`;
		const coreOrError = await fetchJsonCore(exportUrl, "INVALID_EXPORT_JSON_ID");
		results.push({ exportJsonId, ...coreOrError });
	}
	return results;
}

type FetchByUrlArgs = {
	argKey: string;
	defaultError: ResultError;
	messageHandler: (message: MessageOrPartial) => Promise<Result[]>;
	urlHandler: (url: string, defaultError: ResultError) => Promise<FetchCoreResult>;
	urlKey: "jsonUrl" | "pdfUrl";
}
async function _fetchByUrl(sageCommand: SageCommand, args: FetchByUrlArgs): Promise<Result[]> {
	const results: Result[] = [];
	const url = sageCommand.args.getUrl(args.argKey);
	if (url) {
		// if the url points to a message that has the json attached, let's fetch the message and check
		const messageReference = parseReference(url, "message");
		if (messageReference) {
			const message = await sageCommand.discord.fetchMessage(messageReference, sageCommand.authorDid);
			if (message) {
				results.push(...await args.messageHandler(message));
			}else {
				const result: Result = { error:args.defaultError };
				result[args.urlKey] = url;
				results.push(result);
			}

		// let's go fetch the json directly from the url
		}else {
			const result: Result = await args.urlHandler(url, args.defaultError);
			result[args.urlKey] = url;
			results.push(result);
		}
	}
	return results;
}

type FetchByAttachmentArgs = {
	defaultError: ResultError;
	endsWith: string;
	urlHandler: (url: string, defaultError: ResultError) => Promise<FetchCoreResult>;
	urlKey: "jsonUrl" | "pdfUrl";
}
async function _fetchByAttachment(message: MessageOrPartial, args: FetchByAttachmentArgs): Promise<Result[]> {
	const results: Result[] = [];
	if (message.partial) {
		await message.fetch();
	}
	const attachments = message.attachments.values();
	for (const attachment of attachments) {
		if (attachment.url.endsWith(args.endsWith)) {
			const result: Result = await args.urlHandler(attachment.url, args.defaultError);
			result.attachmentName = attachment.name;
			result[args.urlKey] = attachment.url;
			results.push(result);
		}
	}
	return results;
}

async function _fetchByJsonAttachment(message: MessageOrPartial): Promise<Result[]> {
	return _fetchByAttachment(message, {
		defaultError: "INVALID_JSON_ATTACHMENT",
		endsWith: ".json",
		urlHandler: fetchJsonCore,
		urlKey: "jsonUrl"
	});
}

async function fetchByJsonAttachment(sageCommand: SageCommand): Promise<Result[]> {
	if (sageCommand.isSageMessage()) {
		return _fetchByJsonAttachment(sageCommand.message);
	}
	return [];
}

async function fetchByJsonUrl(sageCommand: SageCommand): Promise<Result[]> {
	return _fetchByUrl(sageCommand, {
		argKey: "json",
		defaultError: "INVALID_JSON_URL",
		messageHandler: _fetchByJsonAttachment,
		urlHandler: fetchJsonCore,
		urlKey: "jsonUrl"
	});
}

async function _fetchByPdfAttachment(message: MessageOrPartial): Promise<Result[]> {
	return _fetchByAttachment(message, {
		defaultError: "INVALID_PDF_ATTACHMENT",
		endsWith: ".pdf",
		urlHandler: fetchPdfCore,
		urlKey: "pdfUrl"
	});
}

async function fetchByPdfAttachment(sageCommand: SageCommand): Promise<Result[]> {
	if (sageCommand.isSageMessage()) {
		return _fetchByPdfAttachment(sageCommand.message);
	}
	return [];
}

async function fetchByPdfUrl(sageCommand: SageCommand): Promise<Result[]> {
	return _fetchByUrl(sageCommand, {
		argKey: "pdf",
		defaultError: "INVALID_PDF_URL",
		messageHandler: _fetchByPdfAttachment,
		urlHandler: fetchPdfCore,
		urlKey: "pdfUrl"
	});
}

export async function fetchOrParseAttachment(sageCommand: SageCommand): Promise<Result[]> {
	const results: Result[] = [];
	results.push(...await fetchById(sageCommand));
	results.push(...await fetchByJsonAttachment(sageCommand));
	results.push(...await fetchByJsonUrl(sageCommand));
	results.push(...await fetchByPdfAttachment(sageCommand));
	results.push(...await fetchByPdfUrl(sageCommand));
	return results;
}