import { info } from "@rsc-utils/core-utils";
import { toHumanReadable } from "@rsc-utils/discord-utils";
import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { ActiveBot } from "../../model/ActiveBot.js";
import type { SageMessage } from "../../model/SageMessage.js";

export function registerShutdown(): void {
	registerListeners({
		commands: ["shutdown"],
		message: async (sageMessage: SageMessage) => {
			if (sageMessage.actor.sage.isSuperAdmin || sageMessage.actor.sage.isSuperUser) {
				info(`Shutdown command given by: ${toHumanReadable(sageMessage.actor.discord)}`);
				await sageMessage.reactSuccess();
				await ActiveBot.active.destroy();
				process.exit(0);
			}
		}
	});
}