import type { Awaitable, Optional, Renderable, RenderableContent } from "@rsc-utils/core-utils";
import type { SageInteraction } from "../sage/model/SageInteraction.js";
import type { SageMessage } from "../sage/model/SageMessage.js";
import type { SageReaction } from "../sage/model/SageReaction.js";
import type { ArgsManager } from "./ArgsManager.js";

export interface IMenuRenderable extends Renderable {
	getMenuLength(): number;
	getMenuUnicodeArray(): string[];
	toMenuRenderableContent(): RenderableContent;
	toMenuRenderableContent(index: number): RenderableContent;
}

// export type DInteraction = CommandInteraction | _DInteraction;

// export type DMessage = _DMessage | Message | PartialMessage;

// /** Text Channel */
// export type TChannel = DMessageChannel;

// /** Text Channel or Channel Snowflake */
// export type TChannelResolvable = DChannelResolvable;

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

export type TMessageTester<T = any> = (sageMessage: SageMessage) => Awaitable<Optional<TCommandAndArgs | TCommandAndArgsAndData<T>>>;
export type TMessageHandler<T = any> = (sageMessage: SageMessage, data?: T) => Awaitable<void>;

//#endregion

//#region reaction types

export type TCommand = { command: string; };
export type TCommandAndData<T> = TCommand & { data: T; };

export type TReactionTester<T = any> = (sageReaction: SageReaction) => Awaitable<TCommand | TCommandAndData<T> | null>;
export type TReactionHandler<T = any> = (sageReaction: SageReaction, data?: T) => Awaitable<void>;

//#endregion
