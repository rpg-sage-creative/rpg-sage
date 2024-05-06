import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import { type IGameRole, type TGameRoleType, GameRoleType } from "../../../model/Game.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { createAdminRenderableContent } from "../../cmd.js";

function getGameRoleLabel(gameRole: IGameRole): TGameRoleType {
	return <TGameRoleType>GameRoleType[gameRole.type || 0];
}

async function gameRoleList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const game = sageMessage.game!;

	const renderableContent = createAdminRenderableContent(game, `<b>game-role-list</b>`);
	if (game.roles.length) {
		for (const gameRole of game.roles) {
			const role = await sageMessage.discord.fetchGuildRole(gameRole.did);
			const title = `<b>${getGameRoleLabel(gameRole)}</b> @${role?.name}`;
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

	const roleDid = sageMessage.args.getRoleId("role");
	const roleType = sageMessage.args.getEnum(GameRoleType, "type");
	if (!roleDid || !roleType) {
		return sageMessage.reactFailure();
	}

	const guild = sageMessage.discord.guild;
	const guildRole = await sageMessage.discord.fetchGuildRole(roleDid);
	if (!guild || !guildRole) {
		return sageMessage.reactFailure();
	}

	const game = sageMessage.game!;
	const role = game.getRole(roleType);
	if (!role) {
		const added = await game.addRole(roleType, roleDid);
		return sageMessage.reactSuccessOrFailure(added);
	}
	const updated = await game.updateRole(roleType, roleDid);
	return sageMessage.reactSuccessOrFailure(updated);
}


async function gameRoleRemove(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	const roleType = sageMessage.args.getEnum(GameRoleType, "type");
	if (!roleType) {
		return sageMessage.reactFailure();
	}

	const removed = await sageMessage.game!.removeRole(roleType);
	return sageMessage.reactSuccessOrFailure(removed);
}

//TODO: remove roles by mentioning them
//TODO: have a generic set of role commands that dyanmically figure out game or server roletype

export function registerRole(): void {
	registerListeners({ commands:["game|role|list"], message:gameRoleList });
	registerListeners({ commands:["game|role|add", "game|role|create", "game|role|set"], message:gameRoleSet });
	registerListeners({ commands:["game|role|remove", "game|role|delete", "game|role|unset"], message:gameRoleRemove });
}
