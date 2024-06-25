import { error, formatArg, warn } from "@rsc-utils/core-utils";
import type { DiscordAPIError as TDiscordApiError } from "discord.js";
import { toHumanReadable, type Readable } from "./humanReadable/toHumanReadable.js";

/** https://discord.com/developers/docs/topics/opcodes-and-status-codes#json-json-error-codes */

export function isDiscordApiError(reason: unknown): reason is TDiscordApiError;
export function isDiscordApiError(reason: any): reason is TDiscordApiError {
	return reason?.name === "DiscordAPIError";
}

export class DiscordApiError {
	protected asString: string;
	protected constructor(public error: TDiscordApiError) {
		this.asString = formatArg(error);
	}

	public get isFetchWebhooks() { return this.asString.includes(".fetchWebhooks"); }

	public get isInvalidFormBody() { return this.error.code === 50035; }

	public get isMissingPermissions() { return this.asString.includes("Missing Permissions"); }

	public get isUnknownGuild() { return this.error?.message === "Unknown Guild"; }
	public get isUnknownMember() { return this.error?.message === "Unknown Member"; }
	public get isUnknownUser() { return this.error?.message === "Unknown User"; }

	/** Tries to process various DiscordApiErrors and returns true if logged in some way. */
	public process(): boolean {
		if (this.isInvalidFormBody) {
			error(this.error);
			return true;
		}
		if (this.isFetchWebhooks && this.isMissingPermissions) {
			warn(`DiscordAPIError: Missing Permissions (TextChannel.fetchWebhooks)`);
			return true;
		}
		if (this.isUnknownGuild || this.isUnknownMember || this.isUnknownUser) {
			warn(`${this.error.message}: ${this.error.url}`);
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
