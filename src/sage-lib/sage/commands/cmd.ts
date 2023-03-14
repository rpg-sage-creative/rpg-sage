import * as Discord from "discord.js";
import utils, { OrNull, type Awaitable } from "../../../sage-utils";
import { registerMessageListener } from "../../discord/handlers";
import type { TCommandAndArgs, TMessageHandler } from "../../discord/types";
import ActiveBot from "../model/ActiveBot";
import type { IHasColorsCore } from "../model/HasColorsCore";
import { ColorType } from "../model/HasColorsCore";
import type SageMessage from "../model/SageMessage";
import { ArgsManager } from "../../../sage-utils/utils/ArgsUtils";
import { MessageType } from "../../../sage-utils/utils/DiscordUtils";

export enum BotServerGameType { Bot, Server, Game }

//#region helpers

export function renderCount(sageMessage: SageMessage, label: string, count: number, active?: number): Promise<void> {
	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>count-${label.toLowerCase()}</b>`);
	renderableContent.append(`<b>${label}</b> ${count}`);
	if ((active ?? false) !== false) {
		renderableContent.append(`<b>${label} (active)</b> ${active}`);
		renderableContent.append(`<b>${label} (inactive)</b> ${count - active!}`);
	}
	return <any>sageMessage.send(renderableContent);
}

export function embedColor(color: utils.ColorUtils.Color, ...labels: string[]): Discord.MessageEmbed {
	const embed = new Discord.MessageEmbed();
	embed.setColor(<any>color.toDiscordColor());
	let desc = color.hex;
	if (color.name) {
		desc += ` "${color.name}"`;
	}
	if (labels.length) {
		desc += ` ${labels.join(" ")}`;
	}
	embed.setDescription(desc);
	return embed;
}

export function createRenderableContent(hasColors: IHasColorsCore, colorType: ColorType, title?: string): utils.RenderUtils.RenderableContent {
	const renderableContent = new utils.RenderUtils.RenderableContent(title);
	renderableContent.setColor(hasColors.toDiscordColor(colorType));
	return renderableContent;
}

export function createCommandRenderableContent(title?: string): utils.RenderUtils.RenderableContent {
	return createRenderableContent(ActiveBot.active, ColorType.Command, title);
}

//#endregion

// #region Register Commands

export function registerCommandRegex(matcher: RegExp, handler: TMessageHandler): void;
export function registerCommandRegex(matcher: RegExp, handler: TMessageHandler, type: MessageType): void;
export function registerCommandRegex(matcher: RegExp, handler: TMessageHandler, type = MessageType.Post): void {
	const _tester = async function (sageMessage: SageMessage): Promise<TCommandAndArgs | null> {
		if (!sageMessage.hasPrefix || !sageMessage.slicedContent.match(/^\![^!]/)) {
			return null;
		}
		const match = sageMessage.slicedContent.slice(1).match(matcher);
		if (match) {
			//TODO: move to using groups: match.groups
			return {
				command: "command-regex",
				args: ArgsManager.from(Array.from(match).slice(1).map(s => s ?? ""))
			};
		}
		return null;
	};
	const _handler = async function (sageMessage: SageMessage): Promise<void> {
		return sageMessage.checkDenyCommand("") ?? handler(sageMessage);
	};
	registerMessageListener(_tester, _handler, type);
	// registerMessageListener("MessageListener", { command: handler.name || String(matcher), tester: _tester, handler: _handler, type: type, priorityIndex: undefined });
}

// #endregion

// #region Admin Command Registration

export function createAdminRenderableContent(hasColors: IHasColorsCore, title?: string): utils.RenderUtils.RenderableContent {
	const renderableContent = new utils.RenderUtils.RenderableContent(title);
	renderableContent.setColor(hasColors.toDiscordColor(ColorType.AdminCommand));
	return renderableContent;
}
type TSageMessageHandler = (sageMessage: SageMessage) => Awaitable<void>;
type TCommandHandler = { key: string; regex: RegExp; handler: TSageMessageHandler; };
const handlers: TCommandHandler[] = [];

export function registerAdminCommand(handler: TSageMessageHandler, ...commands: string[]): void {
	commands.forEach(key => {
		const cleanKey = key.trim().toLowerCase();
		const keyRegex = cleanKey.replace(/[\-\s]+/g, "[\\-\\s]*");
		handlers.push({
			key: cleanKey,
			regex: RegExp(`^${keyRegex}(?:$|(\\s+(?:.|\\n)*?)$)`, "i"),
			handler: handler
		});
	});
	handlers.sort((a, b) => a.key.length < b.key.length ? 1 : -1);
}

function findKeyMatchAndReturnCommandAndArgs(slicedContent: string): TCommandAndArgs | null {
	for (const command of handlers) {
		const match = slicedContent.match(command.regex);
		if (match) {
			return {
				command: command.key,
				args: ArgsManager.tokenize(match[1])
			};
		}
	}
	return null;
}
function adminCommandTest(sageMessage: SageMessage): OrNull<TCommandAndArgs> {
	if (!sageMessage.hasPrefix || !sageMessage.slicedContent.startsWith("!!") || sageMessage.slicedContent.match(/^\!\!\s*help/i)) {
		return null;
	}

	const slicedContent = sageMessage.slicedContent.slice(2).trim(),
		adminCommandAndArgs = findKeyMatchAndReturnCommandAndArgs(slicedContent);
	if (adminCommandAndArgs) {
		return adminCommandAndArgs;
	}

	console.error(`I got ${handlers.length} admin handlers, but "${slicedContent}" ain't one!`);

	return null;
}
async function adminCommandHandler(sageMessage: SageMessage): Promise<void> {
	handlers.find(handler => handler.key === sageMessage.command)?.handler(sageMessage);
}

// #endregion

export default function register(): void {
	registerMessageListener(adminCommandTest, adminCommandHandler);
}
