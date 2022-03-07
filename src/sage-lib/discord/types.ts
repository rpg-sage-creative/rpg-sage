import type * as Discord from "discord.js";
import type utils from "../../sage-utils";
import type { Awaitable, IRenderable } from "../../sage-utils";
import type SageInteraction from "../sage/model/SageInteraction";
import type SageMessage from "../sage/model/SageMessage";
import type SageReaction from "../sage/model/SageReaction";
import type ArgsManager from "./ArgsManager";

export type TRenderableContentResolvable = string | IRenderable | utils.RenderUtils.RenderableContent;

export interface IMenuRenderable extends IRenderable {
	getMenuLength(): number;
	getMenuUnicodeArray(): string[];
	toMenuRenderableContent(): utils.RenderUtils.RenderableContent;
	toMenuRenderableContent(index: number): utils.RenderUtils.RenderableContent;
}

export type DInteraction = Discord.CommandInteraction;

/** Discord Message or Partial Message */
export type DMessage = Discord.Message | Discord.PartialMessage;

export type DReaction = Discord.MessageReaction | Discord.PartialMessageReaction;

/** Discord User or Partial User */
export type DUser = Discord.User | Discord.PartialUser;

/** Guild or Guild Snowflake */
export type TGuildResolvable = Discord.Guild | Discord.Snowflake;

/** Text Channel */
export type TChannel = Discord.ThreadChannel | Discord.TextChannel | Discord.DMChannel;

/** Text Channel or Channel Snowflake */
export type TChannelResolvable = TChannel | Discord.Snowflake;

export type THandlerOutput = { tested: number; handled: number; };


//#region interaction type

// export type TCommandAndArgs = { command?: string; args?: ArgsManager; };
// export type TCommandAndArgsAndData<T> = TCommandAndArgs & { data: T; };

export type TInteractionTester<T = any> = (sageInteraction: SageInteraction) => Awaitable<T | null>;
export type TInteractionHandler<T = any> = (sageInteraction: SageInteraction, data?: T) => Awaitable<void>;

//#endregion

//#region message type

export type TCommandAndArgs = { command?: string; args?: ArgsManager; };
export type TCommandAndArgsAndData<T> = TCommandAndArgs & { data: T; };

export type TMessageTester<T = any> = (sageMessage: SageMessage) => Awaitable<TCommandAndArgs | TCommandAndArgsAndData<T> | null>;
export type TMessageHandler<T = any> = (sageMessage: SageMessage, data?: T) => Awaitable<void>;

//#endregion

//#region reaction types

export type TCommand = { command: string; };
export type TCommandAndData<T> = TCommand & { data: T; };

export type TReactionTester<T = any> = (sageReaction: SageReaction) => Awaitable<TCommand | TCommandAndData<T> | null>;
export type TReactionHandler<T = any> = (sageReaction: SageReaction, data?: T) => Awaitable<void>;

//#endregion
