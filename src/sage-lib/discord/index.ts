import { registerPromptHandler } from "./prompts.js";

export * from "./enums.js";
export * from "./types.js";

export function registerPrompts(): void {
	registerPromptHandler();
}