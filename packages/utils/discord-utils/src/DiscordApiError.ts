import { error, formatArg, warn } from "@rsc-utils/core-utils";
import type { DiscordAPIError as TDiscordApiError } from "discord.js";
import { toHumanReadable, type Readable } from "./humanReadable/toHumanReadable.js";

/** https://discord.com/developers/docs/topics/opcodes-and-status-codes#json-json-error-codes */

export function isDiscordApiError(reason: unknown): reason is TDiscordApiError;
export function isDiscordApiError(reason: any): reason is TDiscordApiError {
	return reason?.name === "DiscordAPIError"
		|| isErrorCode(reason?.code)
		|| isWarnCode(reason?.code)
		;
}

function isErrorCode(code?: string | number): boolean {
	return code === 50035 // "Invalid Form Body"
		;
}

function isWarnCode(code?: string | number): boolean {
	return code === 10003 // "Unknown Channel"
		|| code === 10004 // "Unknown Guild"
		|| code === 10007 // "Unknown Member"
		|| code === 10008 // "Unknown Message"
		|| code === 10011 // "Unknown Role"
		|| code === 10013 // "Unknown User"
		|| code === 10014 // "Unknown Emoji"
		|| code === 10015 // "Unknown Webhook"
		|| code === 10062 // "Unknown Interaction"
		;
}

export class DiscordApiError {
	protected asString: string;
	protected constructor(public error: TDiscordApiError) {
		this.asString = formatArg(error);
	}

	public get isAvatarUrl() { return this.asString.includes("avatar_url[URL_TYPE_INVALID_URL]"); }
	public get isEmbedThumbnailUrl() { return this.asString.includes("thumbnail.url[URL_TYPE_INVALID_URL]"); }

	public get isFetchWebhooks() { return this.asString.includes(".fetchWebhooks"); }

	public get isMissingPermissions() { return this.asString.includes("Missing Permissions"); }

	/** Tries to process various DiscordApiErrors and returns true if logged in some way. */
	public process(): boolean {
		if (isErrorCode(this.error.code)) {
			if (this.isAvatarUrl || this.isEmbedThumbnailUrl) {
				warn(`An image url (avatar or thumbnail) has been flagged as invalid.`)
			}else {
				error(this.error);
			}
			return true;
		}
		if (this.isFetchWebhooks && this.isMissingPermissions) {
			warn(`DiscordAPIError[${this.error.code}]: Missing Permissions (TextChannel.fetchWebhooks)`);
			return true;
		}
		if (isWarnCode(this.error.code)) {
			warn(`[${this.error.code}]${this.error.message}: ${this.error.url}`);
			return true;
		}
		return false;
	}

	public static from(reason: unknown): DiscordApiError | undefined {
		return isDiscordApiError(reason) ? new DiscordApiError(reason) : undefined;
	}

	public static process<T extends any = undefined>(err: unknown, options?: { errMsg?:unknown; target?:Readable; retVal?:T; }): T {
		const processed = DiscordApiError.from(err)?.process() ?? false;
		if (!processed) {
			if (options?.target || options?.errMsg) {
				error([toHumanReadable(options.target), options.errMsg].filter(o => o).join(": "));
			}else {
				error(err);
			}
		}
		return options?.retVal as T;
	}
}
