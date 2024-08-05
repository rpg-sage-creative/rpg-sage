import type { Awaitable } from "@rsc-utils/core-utils";
import { debug } from "@rsc-utils/core-utils";
import type { SageCommand } from "../../sage/model/SageCommand.js";
import type { SageInteraction } from "../../sage/model/SageInteraction.js";
import type { SageMessage } from "../../sage/model/SageMessage.js";
import type { SageReaction } from "../../sage/model/SageReaction.js";
import { ArgsManager } from "../ArgsManager.js";
import { registerInteractionListener, registerMessageListener } from "../handlers.js";
import { type TCommandAndArgs } from "../types.js";

type SageCommandHandler = (sageCommand: SageCommand) => Awaitable<void>;
type SageInteractionHandler = (sageInteraction: SageInteraction) => Awaitable<void>;
type SageMessageHandler = (sageMessage: SageMessage) => Awaitable<void>;
type SageReactionHandler = (sageReaction: SageReaction) => Awaitable<void>;

type Command = string | RegExp;

type Args = {
	/** Commands */
	commands: Command[];

	/** Listen to all? */
	handler?: SageCommandHandler;

	/** List to slash commands? */
	interaction?: SageCommandHandler | SageInteractionHandler;

	/** Listen to posted messages? */
	message?: SageCommandHandler | SageMessageHandler;

	/** Listen to reactions? */
	reaction?: SageCommandHandler | SageReactionHandler;
};

function createInteractionTester(command: Command) {
	if (typeof(command) === "string") {
		return (cmd: SageInteraction) => cmd.customIdMatches(command) || cmd.commandMatches(command);
	}
	return (cmd: SageInteraction) => cmd.customIdMatches(command);
}

function commandToMatcher(command: Command): RegExp {
	if (typeof(command) === "string") {
		const commandParts = command.split("|");
		const keyRegex = commandParts.join(" ").replace(/[-\s]+/g, "[\\-\\s]");
		return new RegExp(`^${keyRegex}(?:$|(\\s+(?:.|\\n)*?)$)`, "i");
	}
	return command;
}

function createMessageTester(command: Command) {
	return async function (sageMessage: SageMessage): Promise<TCommandAndArgs | null> {
		if (sageMessage.hasPrefix && /^!!?/.test(sageMessage.slicedContent)) {
			const matcher = commandToMatcher(command);
			const match = matcher.exec(sageMessage.slicedContent.replace(/^!!?/, "").trim());
			if (match) {
				return { command:String(command), args: new ArgsManager(match[1]) };
			}
		}
		return null;
	};

}

export function registerListeners({ commands, interaction, message, reaction, handler }: Args): void {
	for (const command of commands) {

		if (handler || interaction) {
			const tester = createInteractionTester(command);
			registerInteractionListener(tester, handler ?? interaction!);
		}

		if (handler || message) {
			const tester = createMessageTester(command);
			registerMessageListener(tester, handler ?? message!, { command:String(command) });
			// registerCommand(handler ?? message!, command);
		}

		if (handler || reaction) {
			// registerReactionListener(handler ?? tester!, interaction);
			debug(`Unregistered Reaction Handler`);
		}

	}
}
