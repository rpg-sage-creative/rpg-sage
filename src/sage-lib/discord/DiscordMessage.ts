// import * as Discord from "discord.js";
// // import type { OrNull } from "../../sage-utils"
// import type { OrNull } from "../../sage-utils";
// import type { TCommandAndArgs, TRenderableContentResolvable } from "./types"
// import type { THandlerCachesCore } from "./HandlerCaches";
// import { HandlerCaches } from "./HandlerCaches";
// import { ArgsManager } from "./ArgsManager";
// import { send } from "./messages";

// export interface TDiscordMessageCore<T extends THandlerCachesCore> {
// 	cache: Map<String, any>;
// 	caches: HandlerCaches<T>;
// 	message: Discord.Message | Discord.PartialMessage;
// 	originalMessage: Discord.Message | Discord.PartialMessage;
// };

// export type TDiscordMessage = DiscordMessage<THandlerCachesCore, TDiscordMessageCore<THandlerCachesCore>, any>;

// export class DiscordMessage<T extends THandlerCachesCore, U extends TDiscordMessageCore<T>, V extends DiscordMessage<T, any, any>> {

// 	public constructor(protected core: U) { }

// 	public get caches(): HandlerCaches<T> {
// 		return this.core.caches;
// 	}

// 	public get isEdit(): boolean {
// 		return !!this.core.originalMessage;
// 	}

// 	/** Returns the message */
// 	public get message(): Discord.Message | Discord.PartialMessage {
// 		return this.core.message;
// 	}

// 	/** Returns the message */
// 	public get originalMessage(): Discord.Message | Discord.PartialMessage {
// 		return this.core.originalMessage;
// 	}

// 	/** Create a new DiscordMessage from the core. */
// 	public clone(): V {
// 		const constructor = DiscordMessage.DefaultDiscordMessage ?? DiscordMessage;
// 		return <V>new constructor(this.core);
// 	}

// 	//#region Command / Args

// 	protected commandAndArgs: TCommandAndArgs = {
// 		args: new ArgsManager([])
// 	};

// 	public get args(): ArgsManager {
// 		return this.commandAndArgs.args;
// 	}

// 	public get command(): OrNull<string> {
// 		return this.commandAndArgs.command ?? null;
// 	}

// 	public setCommandAndArgs(commandAndArgs?: TCommandAndArgs): V {
// 		this.commandAndArgs = {
// 			args: new ArgsManager(commandAndArgs?.args?.args ?? []),
// 			command: commandAndArgs?.command ?? undefined
// 		};
// 		return <V><TDiscordMessage>this;
// 	}

// 	//#endregion

// 	public async send(renderableContentResolvable: TRenderableContentResolvable, targetChannel = this.message.channel, originalAuthor = this.message.author): Promise<Discord.Message[]> {
// 		return send(this.caches, renderableContentResolvable, targetChannel, originalAuthor);
// 	}

// 	public static async fromMessage<T extends THandlerCachesCore>(message: Discord.Message | Discord.PartialMessage, originalMessage: Discord.Message | Discord.PartialMessage): Promise<TDiscordMessage> {
// 		const cache = new Map();
// 		const caches = HandlerCaches.fromMessage(message);
// 		const constructor = DiscordMessage.DefaultDiscordMessage ?? DiscordMessage;
// 		return new constructor(<TDiscordMessageCore<T>>{ cache, caches, message, originalMessage });
// 	}

// 	public static DefaultDiscordMessage: typeof DiscordMessage;
// }

// export default DiscordMessage;