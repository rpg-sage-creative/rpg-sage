import type { AnyChannel, Guild, GuildChannel, MessageReaction, Snowflake, ThreadChannel } from "discord.js";
import type { Optional } from "../../sage-utils";
import { cleanJson } from "../../sage-utils/utils/JsonUtils";
import type { TDialogMessage } from "../sage/repo/DialogMessageRepository";
import DialogMessageRepository from "../sage/repo/DialogMessageRepository";
import { NilSnowflake } from "./consts";
import type { DInteraction, DMessage, DUser } from "./types";

interface IHasSnowflakeId { id:Snowflake; }
type TSnowflakeResolvable = string | IHasSnowflakeId;
type TAnyChannel = AnyChannel | GuildChannel;

export interface DiscordKeyCore {
	server?: Snowflake;
	channel?: Snowflake;
	thread?: Snowflake;
	message?: Snowflake;
}

export type DiscordKeyArgs = {
	server?: Optional<TSnowflakeResolvable>;
	channel?: Optional<TSnowflakeResolvable>;
	thread?: Optional<TSnowflakeResolvable>;
	message?: Optional<TSnowflakeResolvable>;
};

function argsToCore(args: DiscordKeyArgs): DiscordKeyCore {
	if (!args) {
		console.trace("argsToCore: NO ARGS");
		return { };
	}
	const server = DiscordKey.resolveDid(args.server);
	const channel = DiscordKey.resolveDid(args.channel);
	const thread = DiscordKey.resolveDid(args.thread);
	const message = DiscordKey.resolveDid(args.message);
	return cleanJson({ server, channel, thread, message });
}

function any(...bools: boolean[]): boolean {
	return bools.find(bool => bool) !== undefined;
}

type TNotThreadChannel = Exclude<TAnyChannel, ThreadChannel>;

type TCanHaveGuild = { guild:Guild | null; };
type TMightHaveGuild = TCanHaveGuild | AnyChannel;
function guild(mightHaveGuild?: TMightHaveGuild): Guild | undefined | null {
	return (mightHaveGuild as TCanHaveGuild)?.guild;
}

export type TDiscordKeyResolvable = DiscordKey | DiscordKeyArgs | DiscordKeyCore;

export default class DiscordKey implements DiscordKeyCore {

	private core: DiscordKeyCore;
	public toJSON(): DiscordKeyCore { return this.core; }
	public toString(): string { return this.key; }

	/** External code should only use one of the DiscordKey.from methods */
	private constructor(args: DiscordKeyArgs) {
		this.core = argsToCore(args);
		this.initSnowflakes();
		this.initKeys();
		this.initFlags();
	}

	//#region snowflakes

	public server!: Snowflake;
	public channel!: Snowflake;
	public thread!: Snowflake;
	public message!: Snowflake;

	private initSnowflakes(): void {
		this.server = this.core.server ?? NilSnowflake;
		this.channel = this.core.channel ?? NilSnowflake;
		this.thread = this.core.thread ?? NilSnowflake;
		this.message = this.core.message ?? NilSnowflake;
	}

	//#endregion

	//#region keys

	public key!: string;
	public shortKey!: string;

	private initKeys(): void {
		// include NilSnowflake for missing values
		this.key = [this.server, this.channel, this.thread, this.message].join("-");

		// We only want the Server and the "Most Relevant"
		const { server, channel, thread, message } = this.core;
		const left = server ?? NilSnowflake;
		const right = message ?? thread ?? channel ?? NilSnowflake;
		this.shortKey = `${left}-${right}`;
	}

	//#endregion

	//#region flags

	public hasServer!: boolean;
	public hasChannel!: boolean;
	public hasThread!: boolean;
	public hasMessage!: boolean;

	public isDm!: boolean;
	public isEmpty!: boolean;
	public isValid!: boolean;

	private initFlags(): void {
		this.hasServer = this.server !== NilSnowflake;
		this.hasChannel = this.channel !== NilSnowflake;
		this.hasThread = this.thread !== NilSnowflake;
		this.hasMessage = this.message !== NilSnowflake;

		this.isDm = !this.hasServer;
		this.isEmpty = !any(this.hasServer, this.hasChannel, this.hasThread, this.hasMessage);
		this.isValid = (this.isDm && this.hasChannel) || (this.hasServer && any(this.hasChannel, this.hasThread, this.hasMessage));
	}

	//#endregion

	/** Returns thread if one exists, otherwise it returns the channel */
	public get threadOrChannel(): Snowflake {
		return this.hasThread ? this.thread : this.channel;
	}

	/** Returns a new DiscordKey that doesn't include .message */
	public cloneWithoutMessage(): DiscordKey {
		return new DiscordKey({
			server: this.core.server,
			channel: this.core.channel,
			thread: this.core.thread
		});
	}

	/** Returns a new DiscordKey that includes the given message */
	public cloneForMessage(message: TSnowflakeResolvable): DiscordKey {
		return new DiscordKey({
			server: this.core.server,
			channel: this.core.channel,
			thread: this.core.thread,
			message
		});
	}

	public static toShortKey(discordKey: TDiscordKeyResolvable): string {
		return DiscordKey.from(discordKey).shortKey;
	}

	public static from(discordKey: TDiscordKeyResolvable): DiscordKey {
		return discordKey instanceof DiscordKey ? discordKey : new DiscordKey(discordKey);
	}

	public static fromTarget(target: TAnyChannel | DUser): DiscordKey {
		if ("isThread" in target) {
			return DiscordKey.fromChannel(target);
		}
		return DiscordKey.from({ channel:target });
	}

	public static fromChannel(channel: TAnyChannel): DiscordKey;
	public static fromChannel(anyChannel: TAnyChannel): DiscordKey {
		const thread = anyChannel.isThread() ? anyChannel : undefined;
		const channel = thread?.parent ?? anyChannel as TNotThreadChannel;
		const server = guild(anyChannel);
		return new DiscordKey({ server, channel, thread });
	}

	public static fromDialogMessage(dialogMessage: TDialogMessage): DiscordKey {
		DialogMessageRepository.ensureDiscordKey(dialogMessage);
		return new DiscordKey(dialogMessage.discordKey);
	}

	public static fromInteraction(interaction: DInteraction): DiscordKey {
		if (interaction.channel) {
			return DiscordKey.fromChannel(interaction.channel);
		}
		const server = interaction.guild;
		return new DiscordKey({ server });
	}

	public static fromMessage(message: DMessage): DiscordKey {
		return DiscordKey.fromChannel(message.channel).cloneForMessage(message);
	}

	public static fromMessageReaction(messageReaction: MessageReaction): DiscordKey {
		return DiscordKey.fromMessage(messageReaction.message);
	}

	public static resolveDid(resolvable: TSnowflakeResolvable): Snowflake;
	public static resolveDid(resolvable: Optional<TSnowflakeResolvable>): Snowflake | undefined;
	public static resolveDid(resolvable: Optional<TSnowflakeResolvable>): Snowflake | undefined {
		return typeof(resolvable) === "string" ? resolvable : resolvable?.id;
	}
}
