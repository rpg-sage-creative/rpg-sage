import type SageMessage from "../../../model/SageMessage";
import { AdminRoleType, IAdminRole, TAdminRoleType } from "../../../model/Server";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

function getAdminRoleLabel(adminRole: IAdminRole): TAdminRoleType {
	return <TAdminRoleType>AdminRoleType[adminRole.type ?? 0];
}

async function roleList(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminServer("List Sage Admin Roles");
	if (denial) {
		return denial;
	}

	const server = sageMessage.server;

	const renderableContent = createAdminRenderableContent(server, `<b>Sage Admin Roles</b>`);
	if (server.roles.length) {
		for (const adminRole of server.roles) {
			const role = await sageMessage.discord.fetchGuildRole(adminRole.did);
			const title = `<b>${getAdminRoleLabel(adminRole)}</b> @${role?.name}`;
			const roleId = `<b>Role Id</b> ${adminRole.did}`;
			renderableContent.appendTitledSection(title, roleId);
			//TODO: list users
		}
	} else {
		renderableContent.append(`<blockquote>No Roles Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

async function roleSet(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminServer("Set Sage Admin Role");
	if (denial) {
		return denial;
	}

	const roleDid = sageMessage.args.findRoleDid("role");
	const guildRole = roleDid ? await sageMessage.discord.fetchGuildRole(roleDid) : null;
	const roleType = sageMessage.args.findEnum<AdminRoleType>(AdminRoleType, "type");
	if (!roleDid || !roleType || !guildRole) {
		return sageMessage.reactFailure(`You must provide a valid role and role type. Ex: sage!!role set role="@SageGameAdmin" type="GameAdmin"`);
	}

	const saved = await sageMessage.server.setRole(roleType, roleDid);
	return sageMessage.reactSuccessOrFailure(saved, "Sage Admin Role Set", "Unknown Error; Sage Admin Role NOT Set!");
}

async function roleRemove(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminServer("Remove Sage Admin Role");
	if (denial) {
		return denial;
	}

	const roleType = sageMessage.args.findEnum<AdminRoleType>(AdminRoleType, "type", true);
	if (!roleType) {
		return sageMessage.reactFailure(`You must provide a valid role type. Ex: sage!!role remove type="GameAdmin"`);
	}

	const saved = await sageMessage.server.setRole(roleType, null);
	return sageMessage.reactSuccessOrFailure(saved, "Sage Admin Role Removed", "Unknown Error; Sage Admin Role NOT Removed!");
}

//TODO: remove roles by mentioning them
//TODO: have a generic set of role commands that dyanmically figure out game or server roletype

export default function register(): void {
	registerAdminCommand(roleList, "role-list");
	registerAdminCommandHelp("Admin", "Server", "server role list");

	registerAdminCommand(roleSet, "role-set");
	registerAdminCommandHelp("Admin", "Server", "server role set role=\"@RoleMention\" type=\"GameAdmin\"");

	registerAdminCommand(roleRemove, "role-remove", "server-role-delete", "server-role-unset");
	registerAdminCommandHelp("Admin", "Server", "server role remove type=\"GameAdmin\"");
}
