import { GameRoleType } from "@rsc-sage/data-layer";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { createAdminRenderableContent } from "../../cmd.js";

async function gameRoleList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game!;

	const renderableContent = createAdminRenderableContent(game, `<b>game-role-list</b>`);
	if (game.roles.length) {
		for (const gameRole of game.roles) {
			const role = await sageMessage.discord.fetchGuildRole(gameRole.did);
			const title = `<b>${GameRoleType[gameRole.type || 0]}</b> @${role?.name}`;
			const roleId = `<b>Role Id</b> ${gameRole.did}`;
			renderableContent.appendTitledSection(title, roleId);
			// TODO: list users
		}
	} else {
		renderableContent.append(`<blockquote>No Roles Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

async function gameRoleSet(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const did = sageMessage.args.getRoleId("role");
	const type = sageMessage.args.getEnum(GameRoleType, "type");
	const dicePing = sageMessage.args.getBoolean("dicePing") ?? undefined;
	if (!did || !type) {
		return sageMessage.reactFailure();
	}

	const guild = sageMessage.discord.guild;
	const guildRole = await sageMessage.discord.fetchGuildRole(did);
	if (!guild || !guildRole) {
		return sageMessage.reactFailure();
	}

	const game = sageMessage.game!;
	const saved = await game.setRole({ type, did, dicePing });
	return sageMessage.reactSuccessOrFailure(saved);
}


async function gameRoleRemove(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const roleType = sageMessage.args.getEnum(GameRoleType, "type");
	if (!roleType) {
		return sageMessage.reactFailure();
	}

	const removed = await sageMessage.game!.unsetRole(roleType);
	return sageMessage.reactSuccessOrFailure(removed);
}

//TODO: remove roles by mentioning them
//TODO: have a generic set of role commands that dyanmically figure out game or server roletype

export function registerRole(): void {
	registerListeners({ commands:["game|role|list"], message:gameRoleList });
	registerListeners({ commands:["game|role|add", "game|role|create", "game|role|set"], message:gameRoleSet });
	registerListeners({ commands:["game|role|remove", "game|role|delete", "game|role|unset"], message:gameRoleRemove });
}
