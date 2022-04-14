// import registerPrompts from "./prompts";

/*
// export { default as ArgsManager } from "./ArgsManager";
*/
export * from "./consts";
export { default as DiscordCache } from "./DiscordCache";
export { default as DiscordId } from "./DiscordId";
export { default as DiscordKey } from "./DiscordKey";
export * as embeds from "./embeds";
export * from "./enums";
export * as handlers from "./handlers";
export * as messages from "./messages";
export * as prompts from "./prompts";
export * from "./types";

export default function register(): void {
	// registerPrompts();
}