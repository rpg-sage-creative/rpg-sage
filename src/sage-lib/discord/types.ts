import type { Awaitable } from "@rsc-utils/type-utils";
import type { ButtonInteraction, CommandInteraction, DMChannel, Guild, Message, MessageComponentInteraction, MessageReaction, PartialMessage, PartialMessageReaction, PartialUser, SelectMenuInteraction, Snowflake, TextChannel, ThreadChannel, User } from "discord.js";
import type { IRenderable } from "../../sage-utils";
import type { RenderableContent } from "../../sage-utils/utils/RenderUtils";
import type { SageInteraction } from "../sage/model/SageInteraction";
import type { SageMessage } from "../sage/model/SageMessage";
import type { SageReaction } from "../sage/model/SageReaction";
import type { ArgsManager } from "./ArgsManager";

export type TRenderableContentResolvable = string | IRenderable | RenderableContent;

export interface IMenuRenderable extends IRenderable {
	getMenuLength(): number;
	getMenuUnicodeArray(): string[];
	toMenuRenderableContent(): RenderableContent;
	toMenuRenderableContent(index: number): RenderableContent;
}

export type DInteraction = CommandInteraction | ButtonInteraction | SelectMenuInteraction | MessageComponentInteraction;

/** Discord Message or Partial Message */
export type DMessage = Message | PartialMessage;

export type DReaction = MessageReaction | PartialMessageReaction;

/** Discord User or Partial User */
export type DUser = User | PartialUser;

/** Guild or Guild Snowflake */
export type TGuildResolvable = Guild | Snowflake;

/** Text Channel */
export type TChannel = ThreadChannel | TextChannel | DMChannel;

/** Text Channel or Channel Snowflake */
export type TChannelResolvable = TChannel | Snowflake;

export type THandlerOutput = { tested: number; handled: number; };


//#region interaction type

// export type TCommandAndArgs = { command?: string; args?: ArgsManager; };
// export type TCommandAndArgsAndData<T> = TCommandAndArgs & { data: T; };

export type TInteractionTester<T = any> = (sageInteraction: SageInteraction<any>) => Awaitable<T | null>;
export type TInteractionHandler<T = any> = (sageInteraction: SageInteraction<any>, data?: T) => Awaitable<void>;

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
