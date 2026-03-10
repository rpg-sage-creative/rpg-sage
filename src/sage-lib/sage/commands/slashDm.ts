import { error } from "@rsc-utils/core-utils";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { SageInteraction } from "../model/SageInteraction.js";

//#region dm slash command

async function slashDmHandler(sageInteraction: SageInteraction): Promise<void> {
	const failure = (reason: any) => {
		error(reason);
		return sageInteraction.whisper(`Sorry, there was a problem!`);
	};
	const deferred = () => {
		const success = () => {
			return sageInteraction.whisper(`Please check your DMs!`);
		};
		const dmContent = `Hello!\nRPG Sage will now reply to your Direct Messages.\n*Note: Anytime RPG Sage is disconnected from Discord, you may need to reestablish this connection. We apologize for the inconvenience.*`;
		return sageInteraction.user.send(dmContent).then(success, failure);
	};
	return sageInteraction.replyStack.defer().then(deferred, failure);
}

//#endregion

export function registerSlashDm(): void {
	registerListeners({ commands:["dm"], interaction:slashDmHandler });
}
