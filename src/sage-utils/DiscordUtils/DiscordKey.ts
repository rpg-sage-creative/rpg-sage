import type { ButtonInteraction, Channel, CommandInteraction, Guild, Message, MessageComponentInteraction, PartialMessage, StringSelectMenuInteraction, Snowflake } from "discord.js";
import type { Optional } from "..";
import { cleanJson } from "../JsonUtils";
import { isNonNilSnowflake, orNilSnowflake } from "../SnowflakeUtils";
import type { DChannel } from "./types";

interface IHasSnowflakeId { id:Snowflake; }
type TSnowflakeResolvable = string | IHasSnowflakeId;

export interface DiscordKeyCore {
	server?: Snowflake;
	channel?: Snowflake;
	message?: Snowflake;
}

export type DiscordKeyArgs = {
	server?: Optional<TSnowflakeResolvable>;
	channel?: Optional<TSnowflakeResolvable>;
	/** @deprecated */
	thread?: Optional<TSnowflakeResolvable>;
	message?: Optional<TSnowflakeResolvable>;
};

function argsToCore(args: DiscordKeyArgs): DiscordKeyCore {
	if (!args) {
		console.trace("argsToCore: NO ARGS");
		return { };
	}
	const server = DiscordKey.resolveDid(args.server);
	const thread = DiscordKey.resolveDid(args.thread);
	const channel = thread ?? DiscordKey.resolveDid(args.channel);
	const message = DiscordKey.resolveDid(args.message);
	return cleanJson<DiscordKeyCore>({ server, channel, message });
}

type TCanHaveGuild = { guild:Guild | null; };
type TMightHaveGuild = TCanHaveGuild | Channel;
function guild(mightHaveGuild?: TMightHaveGuild): Guild | undefined | null {
	return (mightHaveGuild as TCanHaveGuild)?.guild;
}

export type TDiscordKeyResolvable = DiscordKey | DiscordKeyArgs | DiscordKeyCore;

export class DiscordKey implements DiscordKeyCore {

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
	public message!: Snowflake;

	private initSnowflakes(): void {
		this.server = orNilSnowflake(this.core.server);
		this.channel = orNilSnowflake(this.core.channel);
		this.message = orNilSnowflake(this.core.message);
	}

	//#endregion

	//#region keys

	public key!: string;
	public shortKey!: string;

	private initKeys(): void {
		// include NilSnowflake for missing values
		this.key = [this.server, this.channel, this.message].join("-");

		// We only want the Server and the "Most Relevant"
		const { server, channel, message } = this.core;
		const left = orNilSnowflake(server);
		const right = orNilSnowflake(message ?? channel);
		this.shortKey = `${left}-${right}`;
	}

	//#endregion

	//#region flags

	public hasServer!: boolean;
	public hasChannel!: boolean;
	public hasMessage!: boolean;

	public isDm!: boolean;
	public isEmpty!: boolean;
	public isValid!: boolean;

	private initFlags(): void {
		this.hasServer = isNonNilSnowflake(this.server);
		this.hasChannel = isNonNilSnowflake(this.channel);
		this.hasMessage = isNonNilSnowflake(this.message);

		this.isDm = !this.hasServer && this.hasChannel;
		this.isEmpty = !this.hasServer && !this.hasChannel && !this.hasMessage;
		this.isValid = this.isDm ? this.hasChannel : this.hasChannel || this.hasMessage;
	}

	//#endregion

	/** Returns a new DiscordKey that doesn't include .message */
	public cloneWithoutMessage(): DiscordKey {
		return new DiscordKey({
			server: this.core.server,
			channel: this.core.channel
		});
	}

	/** Returns a new DiscordKey that includes the given message */
	public cloneForMessage(message: TSnowflakeResolvable): DiscordKey {
		return new DiscordKey({
			server: this.core.server,
			channel: this.core.channel,
			message
		});
	}

	public static toShortKey(discordKey: TDiscordKeyResolvable): string {
		return DiscordKey.from(discordKey).shortKey;
	}

	public static from(discordKey: TDiscordKeyResolvable): DiscordKey {
		return discordKey instanceof DiscordKey ? discordKey : new DiscordKey(discordKey);
	}

	public static fromChannel(channel: DChannel): DiscordKey {
		const server = guild(channel);
		return new DiscordKey({ server, channel });
	}

	/**
	 * @deprecated
	 * use: DialogMessageRepository.ensureDiscordKey(dialogMessage); new DiscordKey(dialogMessage.discordKey);
	*/
	public static fromDialogMessage(_: any): null { return null; }

	public static fromInteraction(interaction: CommandInteraction | ButtonInteraction | StringSelectMenuInteraction | MessageComponentInteraction): DiscordKey {
		if (interaction.channel) {
			return DiscordKey.fromChannel(interaction.channel as DChannel);
		}
		const server = interaction.guild;
		return new DiscordKey({ server });
	}

	public static fromMessage(message: Message | PartialMessage): DiscordKey {
		return DiscordKey.fromChannel(message.channel as DChannel).cloneForMessage(message);
	}

	// public static fromMessageReaction(messageReaction: MessageReaction): DiscordKey {
	// 	return DiscordKey.fromMessage(messageReaction.message);
	// }

	public static resolveDid(resolvable: TSnowflakeResolvable): Snowflake;
	/** NilSnowflake becomes undefined. */
	public static resolveDid(resolvable: Optional<TSnowflakeResolvable>): Snowflake | undefined;
	public static resolveDid(resolvable: Optional<TSnowflakeResolvable>): Snowflake | undefined {
		const did = typeof(resolvable) === "string" ? resolvable : resolvable?.id;
		return isNonNilSnowflake(did) ? did : undefined;
	}
}
