import { debug } from "@rsc-utils/console-utils";
import type { Awaitable } from "@rsc-utils/type-utils";
import type { SageCommand } from "../../sage/model/SageCommand.js";
import type { SageInteraction } from "../../sage/model/SageInteraction.js";
import type { SageMessage } from "../../sage/model/SageMessage.js";
import type { SageReaction } from "../../sage/model/SageReaction.js";
import { ArgsManager } from "../ArgsManager.js";
import { registerInteractionListener, registerMessageListener } from "../handlers.js";
import { TCommandAndArgs } from "../types.js";

type SageCommandHandler = (sageCommand: SageCommand) => Awaitable<void>;
type SageInteractionHandler = (sageInteraction: SageInteraction) => Awaitable<void>;
type SageMessageHandler = (sageMessage: SageMessage) => Awaitable<void>;
type SageReactionHandler = (sageReaction: SageReaction) => Awaitable<void>;

type Args = {
	/** Commands */
	commands: string[];

	/** Listen to all? */
	handler?: SageCommandHandler;

	/** List to slash commands? */
	interaction?: SageCommandHandler | SageInteractionHandler;

	/** Listen to posted messages? */
	message?: SageCommandHandler | SageMessageHandler;

	/** Listen to reactions? */
	reaction?: SageCommandHandler | SageReactionHandler;
};

function createInteractionTester(commandParts: string[]) {
	return (cmd: SageCommand) => cmd.isCommand(...commandParts);
}

function createMessageTester(command: string) {
	return async function (sageMessage: SageMessage): Promise<TCommandAndArgs | null> {
		if (sageMessage.hasPrefix && /^!!?/.test(sageMessage.slicedContent)) {
			const commandParts = command.split("|");
			const keyRegex = commandParts.join(" ").replace(/[-\s]+/g, "[\\-\\s]");
			const matcher = new RegExp(`^${keyRegex}(?:$|(\\s+(?:.|\\n)*?)$)`, "i");
			const match = matcher.exec(sageMessage.slicedContent.replace(/^!!?/, "").trim());
			if (match) {
				return { command, args: new ArgsManager(match[1]) };
			}
		}
		return null;
	};

}

export function registerListeners({ commands, interaction, message, reaction, handler }: Args): void {
	for (const command of commands) {
		const commandParts = command.split("|");

		if (handler || interaction) {
			const tester = createInteractionTester(commandParts);
			registerInteractionListener(tester, handler ?? interaction!);
		}

		if (handler || message) {
			const tester = createMessageTester(command);
			registerMessageListener(tester, handler ?? message!, { command });
			// registerCommand(handler ?? message!, command);
		}

		if (handler || reaction) {
			// registerReactionListener(handler ?? tester!, interaction);
			debug(`Unregistered Reaction Handler`);
		}

	}
}
