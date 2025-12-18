import type { Awaitable } from "@rsc-utils/core-utils";
import { ArgsManager, debug, escapeRegex } from "@rsc-utils/core-utils";
import type { SageCommand } from "../../sage/model/SageCommand.js";
import type { SageInteraction } from "../../sage/model/SageInteraction.js";
import type { SageMessage } from "../../sage/model/SageMessage.js";
import type { SageReaction } from "../../sage/model/SageReaction.js";
import { registerInteractionListener, registerMessageListener } from "../handlers.js";
import { type TCommandAndArgs } from "../types.js";
import { DefaultPrefixRegExp } from "./DefaultPrefixRegExp.js";

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

function createCommandRegexWithArgsCaptureGroup(commandRegex: string): RegExp {
	return new RegExp(`^${commandRegex}(?:$|\\s+(?<args>(?:.|\\n)*?)$)`, "i");
}

function commandToMatcher(command: Command): RegExp {
	// we have to build the regexp for testing the command and getting args
	if (typeof(command) === "string") {
		const commandParts = command.split("|");
		const keyRegex = commandParts.map(part => escapeRegex(part)).join("\\s+");
		return createCommandRegexWithArgsCaptureGroup(keyRegex);

	// the regex doesn't include command arg capture group
	}else if (!command.source.startsWith("^") && !command.source.endsWith("$")) {
		return createCommandRegexWithArgsCaptureGroup(command.source);

	}
	return command;
}

function createMessageTester(_command: Command) {
	return async function (sageMessage: SageMessage): Promise<TCommandAndArgs | null> {
		if (sageMessage.hasPrefix && DefaultPrefixRegExp.test(sageMessage.slicedContent)) {
			const matcher = commandToMatcher(_command);
			const match = matcher.exec(sageMessage.slicedContent.replace(DefaultPrefixRegExp, "").trim());
			if (match) {
				const { object, verb, args, alias } = match.groups ?? {};
				const toCommandAndArgs = (data?: any) => {
					return {
						command: object && verb ? `${object}|${verb}` : String(_command),
						args: ArgsManager.from(args ?? match[match.length - 1] ?? ""),
						data
					} as TCommandAndArgs;
				};
				if (alias) {
					const char = sageMessage.findCharacter(alias);
					return char ? toCommandAndArgs(char) : null;
				}
				return toCommandAndArgs();
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
