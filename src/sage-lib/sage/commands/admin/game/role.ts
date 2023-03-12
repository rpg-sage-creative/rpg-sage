import { IGameRole, TGameRoleType, GameRoleType } from "../../../model/Game";
import type SageMessage from "../../../model/SageMessage";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

function getGameRoleLabel(gameRole: IGameRole): TGameRoleType {
	return <TGameRoleType>GameRoleType[gameRole.type || 0];
}

async function gameRoleList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminGame()) {
		return sageMessage.denyForCanAdminGame("List Game Roles");
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
	if (!sageMessage.checkCanAdminGame()) {
		return sageMessage.denyForCanAdminGame("Set Game Role");
	}

	const roleDid = sageMessage.args.findRoleDid("role", true);
	const roleType = sageMessage.args.findEnum<GameRoleType>(GameRoleType, "type", true);
	if (!roleDid || !roleType) {
		return sageMessage.reactFailure("Missing role or type values.");
	}

	const guild = sageMessage.discord.guild;
	const guildRole = await sageMessage.discord.fetchGuildRole(roleDid);
	if (!guild || !guildRole) {
		return sageMessage.reactFailure("Invalid role or type values.");
	}

	const game = sageMessage.game!;
	const role = game.getRole(roleType);
	if (!role) {
		const added = await game.addRole(roleType, roleDid);
		return sageMessage.reactSuccessOrFailure(added, "Game Role Set", "Unknown Error; Game Role NOT Set");
	}
	const updated = await game.updateRole(roleType, roleDid);
	return sageMessage.reactSuccessOrFailure(updated, "Game Role Set", "Unknown Error; Game Role NOT Set");
}


async function gameRoleRemove(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminGame()) {
		return sageMessage.denyForCanAdminGame("Remove Game Role");
	}

	const roleType = sageMessage.args.findEnum<GameRoleType>(GameRoleType, "type", true);
	if (!roleType) {
		return sageMessage.reactFailure("Missing or Invalid role type.");
	}

	const removed = await sageMessage.game!.removeRole(roleType);
	return sageMessage.reactSuccessOrFailure(removed, "Game Role Removed", "Unknown Error; Game Role NOT Removed");
}

//TODO: remove roles by mentioning them
//TODO: have a generic set of role commands that dyanmically figure out game or server roletype

export default function register(): void {
	registerAdminCommand(gameRoleList, "game-role-list");
	registerAdminCommandHelp("Admin", "Game", "role list");

	registerAdminCommand(gameRoleSet, "game-role-set");
	registerAdminCommandHelp("Admin", "Game", "game role set {@RoleMention} {GameRoleType}");

	registerAdminCommand(gameRoleRemove, "game-role-remove", "game-role-delete", "game-role-unset");
	registerAdminCommandHelp("Admin", "Game", "game role remove {GameRoleType}");
}
