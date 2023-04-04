import type { Awaitable } from "../../sage-utils";
import type { ArgsManager } from "../../sage-utils/ArgsUtils";
import type { SageInteraction } from "../sage/model/SageInteraction";
import type { SageMessage } from "../sage/model/SageMessage";
import type { SageReaction } from "../sage/model/SageReaction";

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
