import type { Awaitable } from "../..";
import type { LogLevel } from "./enums";

export type TConsoleCommandType = "Error" | "Debug" | "Warn" | "Info";

export type TConsoleHandler = (consoleCommand: LogLevel, ...args: any[]) => Awaitable<void>;
