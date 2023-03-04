import type SageMessage from "../../../model/SageMessage";
import { AdminRoleType, IAdminRole, TAdminRoleType } from "../../../model/Server";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

function getAdminRoleLabel(adminRole: IAdminRole): TAdminRoleType {
	return <TAdminRoleType>AdminRoleType[adminRole.type ?? 0];
}

async function roleList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminServer()) {
		return sageMessage.reactBlock("Must be a Server Owner, Server Administrator, or Server Manager!");
	}

	const server = sageMessage.server;

	const renderableContent = createAdminRenderableContent(server, `<b>server-role-list</b>`);
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

async function roleSet(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminServer()) {
		return sageMessage.reactBlock("Must be a Server Owner, Server Administrator, or Server Manager!");
	}

	const roleDid = sageMessage.args.findRoleDid("role");
	const guildRole = roleDid ? await sageMessage.discord.fetchGuildRole(roleDid) : null;
	const roleType = sageMessage.args.findEnum<AdminRoleType>(AdminRoleType, "type");
	if (!roleDid || !roleType || !guildRole) {
		return sageMessage.reactFailure(`You must provide a valid role and role type. Ex: sage!!admin add user="@User" role="GameAdmin"`);
	}

	const saved = await sageMessage.server.setRole(roleType, roleDid);
	return sageMessage.reactSuccessOrFailure(saved);
}

async function roleRemove(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.checkCanAdminServer()) {
		return sageMessage.reactBlock("Must be a Server Owner, Server Administrator, or Server Manager!");
	}

	const roleType = sageMessage.args.findEnum<AdminRoleType>(AdminRoleType, "type", true);
	if (!roleType) {
		return sageMessage.reactFailure();
	}

	const saved = await sageMessage.server.setRole(roleType, null);
	return sageMessage.reactSuccessOrFailure(saved);
}

//TODO: remove roles by mentioning them
//TODO: have a generic set of role commands that dyanmically figure out game or server roletype

export default function register(): void {
	registerAdminCommand(roleList, "role-list");
	registerAdminCommandHelp("Admin", "Server", "server role list");

	registerAdminCommand(roleSet, "role-set");
	registerAdminCommandHelp("Admin", "Server", "server role set {@RoleMention} {ServerRoleType}");

	registerAdminCommand(roleRemove, "role-remove", "server-role-delete", "server-role-unset");
	registerAdminCommandHelp("Admin", "Server", "server role remove {ServerRoleType}");
}
