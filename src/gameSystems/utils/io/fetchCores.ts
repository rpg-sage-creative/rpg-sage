import type { CharacterBase, CharacterBaseCore } from "@rsc-utils/game-utils";
import { isInvalidWebhookUsername, parseReference, type MessageOrPartial } from "@rsc-utils/discord-utils";
import { getJson, PdfCacher, type PdfJson } from "@rsc-utils/io-utils";
import type { SageCommand } from "../../../sage-lib/sage/model/SageCommand.js";
import type { FetchResultError } from "./handleImportErrors.js";

export type FetchCoreResult<T extends CharacterBaseCore, U extends CharacterBase<T> = CharacterBase<T>> = {
	char: U;
	core: T;
	error?: never;
} | {
	char?: never;
	core?: never;
	error: FetchResultError;
} | {
	char?: never;
	core: T;
	error: "USERNAME_MISSING";
} | {
	char?: never;
	core: T;
	error: "USERNAME_TOO_LONG" | "USERNAME_S_BANNED";
	invalidName: string;
};

export type ImportHandlers<T extends CharacterBaseCore, U extends CharacterBase<T> = CharacterBase<T>> = {
	/** create an instance from a core */
	char: (core: T) => U;
	/** convert PdfJson to character core */
	pdf: (pdfJson: PdfJson) => T | undefined;
	/** convert raw json to character core */
	raw: (rawJson: unknown) => T | undefined;
};

export function coreToResult<T extends CharacterBaseCore, U extends CharacterBase<T> = CharacterBase<T>>(core: T, toChar: (core: T) => U): FetchCoreResult<T> {
	const invalidName = isInvalidWebhookUsername(core.name);
	if (invalidName === true) {
		return core.name
			? { core, error:"USERNAME_TOO_LONG", invalidName:core.name }
			: { core, error:"USERNAME_MISSING" };
	}else if (invalidName) {
		return { core, error:"USERNAME_S_BANNED", invalidName:core.name! };
	}
	return { core, char:toChar(core) };
}

export async function fetchJsonCore<T extends CharacterBaseCore>(jsonUrl: string, error: FetchResultError, handlers: ImportHandlers<T>): Promise<FetchCoreResult<T>> {
	const json = await getJson(jsonUrl).catch(() => undefined);
	if (!json) {
		return { error };
	}

	const core = handlers.raw(json);
	if (core) {
		return coreToResult(core, handlers.char);
	}

	return { error:"UNSUPPORTED_JSON" };
}

async function fetchPdfCore<T extends CharacterBaseCore>(pdfUrl: string, defaultError: FetchResultError, handlers: ImportHandlers<T>): Promise<FetchCoreResult<T>> {
	let error = defaultError;
	const pdfJson = await PdfCacher.read<PdfJson>(pdfUrl).catch(() => {
		error = "INVALID_PDF";
		return undefined;
	});
	if (!pdfJson) {
		return { error };
	}

	const core = handlers.pdf(pdfJson);
	if (core) {
		return coreToResult(core, handlers.char);
	}

	return { error:"UNSUPPORTED_PDF" };
}

// async function fetchTsvCores(tsvUrl: string, error: FetchResultError, handlers: Handlers<any>): Promise<FetchCoreResult<any>> {
// 	const tsv = await fetchTsv(tsvUrl as VALID_URL)
// 		.catch(() => { error = "INVALID_TSV"; return undefined; });
// 	if (!tsv) return { error };

// 	if (tsv.keys.length && tsv.items.length) {
// 		if (tsv.items.some(item => hasDiscordInName(item["name"]))) {
// 			return { tsv, error:"INVALID_NAME" };
// 		}
// 		return { tsv };
// 	}

// 	return { error:"UNSUPPORTED_PDF" };
// }

export type FetchResult<T extends CharacterBaseCore> = FetchCoreResult<T> & {
	/** name of the attachment parsed */
	attachmentName?: string;
	/** id used to construct a url */
	id?: number | string;
	/** url to the json file or json attachment */
	jsonUrl?: string;
	/** url to the pdf file or pdf attachment */
	pdfUrl?: string;
};

type FetchByUrlArgs<T extends CharacterBaseCore> = {
	argKey: string;
	defaultError: FetchResultError;
	firstOnly: boolean;
	messageHandler: (message: MessageOrPartial, handlers: ImportHandlers<T>, args: FetchArgs) => Promise<FetchResult<T>[]>;
	urlHandler: (url: string, defaultError: FetchResultError, handlers: ImportHandlers<T>) => Promise<FetchCoreResult<T>>;
	urlKey: "jsonUrl" | "pdfUrl";
};

async function _fetchByUrl<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: ImportHandlers<T>, args: FetchByUrlArgs<T>): Promise<FetchResult<T>[]> {
	const results: FetchResult<T>[] = [];
	const url = sageCommand.args.getUrl(args.argKey);
	if (url) {
		// if the url points to a message that has the json attached, let's fetch the message and check
		const messageReference = parseReference(url, "message");
		if (messageReference) {
			const message = await sageCommand.discord.fetchMessage(messageReference, sageCommand.actorId);
			if (message) {
				results.push(...await args.messageHandler(message, handlers, { firstOnly:args.firstOnly }));
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
	contentTypes: string[];
	firstOnly: boolean;
	urlHandler: (url: string, defaultError: FetchResultError, handlers: ImportHandlers<T>) => Promise<FetchCoreResult<T>>;
	urlKey: "jsonUrl" | "pdfUrl";
};

async function _fetchByAttachment<T extends CharacterBaseCore>(message: MessageOrPartial, handlers: ImportHandlers<T>, args: FetchByAttachmentArgs<T>): Promise<FetchResult<T>[]> {
	const results: FetchResult<T>[] = [];
	if (message.partial) {
		await message.fetch();
	}
	const attachments = message.attachments.values();
	for (const attachment of attachments) {
		const isMatch = args.contentTypes.some(type => attachment.contentType?.includes(type));
		if (isMatch) {
			const result: FetchResult<T> = await args.urlHandler(attachment.url, args.defaultError, handlers);
			result.attachmentName = attachment.name;
			result[args.urlKey] = attachment.url;
			results.push(result);
			if (args.firstOnly) {
				break;
			}
		}
	}
	return results;
}

type FetchArgs = { firstOnly:boolean; };

async function _fetchByJsonAttachment<T extends CharacterBaseCore>(message: MessageOrPartial, handlers: ImportHandlers<T>, args: FetchArgs): Promise<FetchResult<T>[]> {
	return _fetchByAttachment(message, handlers, {
		contentTypes: ["text/plain", "json"],
		defaultError: "INVALID_JSON_ATTACHMENT",
		firstOnly: args.firstOnly,
		urlHandler: fetchJsonCore,
		urlKey: "jsonUrl"
	});
}

async function fetchByJsonAttachment<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: ImportHandlers<T>, args: FetchArgs): Promise<FetchResult<T>[]> {
	if (sageCommand.isSageMessage()) {
		return _fetchByJsonAttachment(sageCommand.message, handlers, args);
	}
	return [];
}

async function fetchByJsonUrl<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: ImportHandlers<T>, args: FetchArgs): Promise<FetchResult<T>[]> {
	return _fetchByUrl(sageCommand, handlers, {
		argKey: "json",
		defaultError: "INVALID_JSON_URL",
		firstOnly: args.firstOnly,
		messageHandler: _fetchByJsonAttachment,
		urlHandler: fetchJsonCore,
		urlKey: "jsonUrl"
	});
}

async function _fetchByPdfAttachment<T extends CharacterBaseCore>(message: MessageOrPartial, handlers: ImportHandlers<T>, args: FetchArgs): Promise<FetchResult<T>[]> {
	return _fetchByAttachment(message, handlers, {
		contentTypes: ["pdf"],
		defaultError: "INVALID_PDF_ATTACHMENT",
		firstOnly: args.firstOnly,
		urlHandler: fetchPdfCore,
		urlKey: "pdfUrl"
	});
}

async function fetchByPdfAttachment<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: ImportHandlers<T>, args: FetchArgs): Promise<FetchResult<T>[]> {
	if (sageCommand.isSageMessage()) {
		return _fetchByPdfAttachment(sageCommand.message, handlers, args);
	}
	return [];
}

async function fetchByPdfUrl<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: ImportHandlers<T>, args: FetchArgs): Promise<FetchResult<T>[]> {
	return _fetchByUrl(sageCommand, handlers, {
		argKey: "pdf",
		defaultError: "INVALID_PDF_URL",
		firstOnly: args.firstOnly,
		messageHandler: _fetchByPdfAttachment,
		urlHandler: fetchPdfCore,
		urlKey: "pdfUrl"
	});
}

export async function fetchCore<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: ImportHandlers<T>): Promise<FetchResult<T> | undefined> {
	const args = { firstOnly:true };
	return (await fetchByJsonAttachment<T>(sageCommand, handlers, args))[0]
		?? (await fetchByJsonUrl<T>(sageCommand, handlers, args))[0]
		?? (await fetchByPdfAttachment<T>(sageCommand, handlers, args))[0]
		?? (await fetchByPdfUrl<T>(sageCommand, handlers, args))[0];
}

export async function fetchCores<T extends CharacterBaseCore>(sageCommand: SageCommand, handlers: ImportHandlers<T>): Promise<FetchResult<T>[]> {
	const args = { firstOnly:false };
	const results: FetchResult<T>[] = [];
	results.push(...await fetchByJsonAttachment<T>(sageCommand, handlers, args));
	results.push(...await fetchByJsonUrl<T>(sageCommand, handlers, args));
	results.push(...await fetchByPdfAttachment<T>(sageCommand, handlers, args));
	results.push(...await fetchByPdfUrl<T>(sageCommand, handlers, args));
	return results;
}
