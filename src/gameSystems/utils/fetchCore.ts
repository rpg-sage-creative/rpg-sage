import { debug } from "@rsc-utils/core-utils";
import { parseReference, type MessageOrPartial } from "@rsc-utils/discord-utils";
import { getJson, PdfCacher, type PdfJson } from "@rsc-utils/io-utils";
import type { SageCommand } from "../../sage-lib/sage/model/SageCommand.js";
import type { CharacterBase, CharacterBaseCore } from "@rsc-utils/character-utils";

type FetchResultError = "INVALID_ID"
	| "INVALID_JSON_URL" | "INVALID_JSON_ATTACHMENT" | "INVALID_JSON" | "UNSUPPORTED_JSON"
	| "INVALID_PDF_URL" | "INVALID_PDF_ATTACHMENT" | "INVALID_PDF" | "UNSUPPORTED_PDF";

type FetchCoreResult<T extends CharacterBaseCore, U extends CharacterBase<T> = CharacterBase<T>> = {
	char?: U;
	core?: T;
	error?: FetchResultError;
};

type Handlers<T extends CharacterBaseCore, U extends CharacterBase<T> = CharacterBase<T>> = {
	/** create an instance from a core */
	char: (core: T) => U;
	/** convert PdfJson to character core */
	pdf: (pdfJson: PdfJson) => T | undefined;
	/** convert raw json to character core */
	raw: (rawJson: unknown) => T | undefined;
};

export async function fetchJsonCore<T extends CharacterBaseCore>(jsonUrl: string, error: FetchResultError, handlers: Handlers<T>): Promise<FetchCoreResult<T>> {
	const json = await getJson(jsonUrl)
		.catch(err => { debug(err); return undefined; });
	if (!json) return { error };

	const core = handlers.raw(json);
	if (core) return { core, char:handlers.char(core) };

	return { error:"UNSUPPORTED_JSON" };
}

async function fetchPdfCore<T extends CharacterBaseCore>(pdfUrl: string, error: FetchResultError, handlers: Handlers<T>): Promise<FetchCoreResult<T>> {
	const pdfJson = await PdfCacher.read<PdfJson>(pdfUrl)
		.catch(() => { error = "INVALID_PDF"; return undefined; });
	if (!pdfJson) return { error };

	const core = handlers.pdf(pdfJson);
	if (core) return { core, char:handlers.char(core) };

	return { error:"UNSUPPORTED_PDF" };
}

export type FetchResult<T extends CharacterBaseCore> = FetchCoreResult<T> & {

	/** name of the attachment parsed */
	attachmentName?: string;
	/** id used to construct a url */
	id?: number;
	/** url to the json file or json attachment */
	jsonUrl?: string;
	/** url to the pdf file or pdf attachment */
	pdfUrl?: string;
}

type FetchByUrlArgs<T extends CharacterBaseCore> = {
	argKey: string;
	defaultError: FetchResultError;
	messageHandler: (message: MessageOrPartial, handlers: Handlers<T>) => Promise<FetchResult<T>[]>;
	urlHandler: (url: string, defaultError: FetchResultError, handlers: Handlers<T>) => Promise<FetchCoreResult<T>>;
	urlKey: "jsonUrl" | "pdfUrl";
}
async function _fetchByUrl<T extends CharacterBaseCore>(sageCommand: SageCommand, args: FetchByUrlArgs<T>, handlers: Handlers<T>): Promise<FetchResult<T>[]> {
	const results: FetchResult<T>[] = [];
	const url = sageCommand.args.getUrl(args.argKey);
	if (url) {
		// if the url points to a message that has the json attached, let's fetch the message and check
		const messageReference = parseReference(url, "message");
		if (messageReference) {
			const message = await sageCommand.discord.fetchMessage(messageReference, sageCommand.authorDid);
			if (message) {
				results.push(...await args.messageHandler(message, handlers));
			}else {
				const result: FetchResult<T> = { error:args.defaultError };
				result[args.urlKey] = url;
				results.push(result);
			}

		// let's go fetch the json directly from the url
		}else {
			const result: FetchResult<T> = await args.urlHandler(url, args.defaultError, handlers);
			result[args.urlKey] = url;
			results.push(result);
		}
	}
	return results;
}

type FetchByAttachmentArgs<T extends CharacterBaseCore> = {
	defaultError: FetchResultError;
	endsWith: string;
	urlHandler: (url: string, defaultError: FetchResultError, handlers: Handlers<T>) => Promise<FetchCoreResult<T>>;
	urlKey: "jsonUrl" | "pdfUrl";
}
async function _fetchByAttachment<T extends CharacterBaseCore>(message: MessageOrPartial, args: FetchByAttachmentArgs<T>, handlers: Handlers<T>): Promise<FetchResult<T>[]> {
	const results: FetchResult<T>[] = [];
	if (message.partial) {
		await message.fetch();
	}
	const attachments = message.attachments.values();
	for (const attachment of attachments) {
		if (attachment.url.endsWith(args.endsWith)) {
			const result: FetchResult<T> = await args.urlHandler(attachment.url, args.defaultError, handlers);
			result.attachmentName = attachment.name;
			result[args.urlKey] = attachment.url;
			results.push(result);
		}
	}
	return results;
}

async function _fetchByJsonAttachment<T extends CharacterBaseCore>(message: MessageOrPartial, handlers: Handlers<T>): Promise<FetchResult<T>[]> {
	return _fetchByAttachment(message, {
		defaultError: "INVALID_JSON_ATTACHMENT",
		endsWith: ".json",
		urlHandler: fetchJsonCore,
		urlKey: "jsonUrl"
	}, handlers);
}

async function fetchByJsonAttachment<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: Handlers<T>): Promise<FetchResult<T>[]> {
	if (sageCommand.isSageMessage()) {
		return _fetchByJsonAttachment(sageCommand.message, handlers);
	}
	return [];
}

async function fetchByJsonUrl<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: Handlers<T>): Promise<FetchResult<T>[]> {
	return _fetchByUrl(sageCommand, {
		argKey: "json",
		defaultError: "INVALID_JSON_URL",
		messageHandler: _fetchByJsonAttachment,
		urlHandler: fetchJsonCore,
		urlKey: "jsonUrl"
	}, handlers);
}

async function _fetchByPdfAttachment<T extends CharacterBaseCore>(message: MessageOrPartial, handlers: Handlers<T>): Promise<FetchResult<T>[]> {
	return _fetchByAttachment(message, {
		defaultError: "INVALID_PDF_ATTACHMENT",
		endsWith: ".pdf",
		urlHandler: fetchPdfCore,
		urlKey: "pdfUrl"
	}, handlers);
}

async function fetchByPdfAttachment<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: Handlers<T>): Promise<FetchResult<T>[]> {
	if (sageCommand.isSageMessage()) {
		return _fetchByPdfAttachment(sageCommand.message, handlers);
	}
	return [];
}

async function fetchByPdfUrl<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: Handlers<T>): Promise<FetchResult<T>[]> {
	return _fetchByUrl(sageCommand, {
		argKey: "pdf",
		defaultError: "INVALID_PDF_URL",
		messageHandler: _fetchByPdfAttachment,
		urlHandler: fetchPdfCore,
		urlKey: "pdfUrl"
	}, handlers);
}

export async function fetchCore<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: Handlers<T>): Promise<FetchResult<T>> {
	const results: FetchResult<T>[] = [];
	if (!results.length) results.push(...await fetchByJsonAttachment<T>(sageCommand, handlers));
	if (!results.length) results.push(...await fetchByJsonUrl<T>(sageCommand, handlers));
	if (!results.length) results.push(...await fetchByPdfAttachment<T>(sageCommand, handlers));
	if (!results.length) results.push(...await fetchByPdfUrl<T>(sageCommand, handlers));
	return results[0];
}

export async function fetchCores<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: Handlers<T>): Promise<FetchResult<T>[]> {
	const results: FetchResult<T>[] = [];
	results.push(...await fetchByJsonAttachment<T>(sageCommand, handlers));
	results.push(...await fetchByJsonUrl<T>(sageCommand, handlers));
	results.push(...await fetchByPdfAttachment<T>(sageCommand, handlers));
	results.push(...await fetchByPdfUrl<T>(sageCommand, handlers));
	return results;
}

type FetchErrorHandler<T extends SageCommand> = (sageCommand: T, message: string) => Promise<void>;
export async function handleFetchError<T extends SageCommand>(sageCommand: T, fetchResult: FetchResult<any>, handler: FetchErrorHandler<T>): Promise<void> {
	switch (fetchResult.error) {
		case "INVALID_ID": return handler(sageCommand, "the given ID is invalid.");
		case "INVALID_JSON_ATTACHMENT": return handler(sageCommand, "The attached JSON is invalid.");
		case "INVALID_JSON_URL": return handler(sageCommand, "The given JSON url is invalid.");
		case "INVALID_JSON": return handler(sageCommand, "The given JSON is invalid.");
		case "UNSUPPORTED_JSON": return handler(sageCommand, "The given JSON is unsupported.");
		case "INVALID_PDF_ATTACHMENT": return handler(sageCommand, "The attached PDF is invalid.");
		case "INVALID_PDF_URL": return handler(sageCommand, "The given PDF url is invalid.");
		case "INVALID_PDF": return handler(sageCommand, "The given PDF is invalid.");
		case "UNSUPPORTED_PDF": return handler(sageCommand, "The given PDF is unsupported.");
		default: debug({fetchResult}); return handler(sageCommand, "Sorry, we don't know what went wrong!");
	}
}