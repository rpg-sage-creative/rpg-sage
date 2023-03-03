import type SageMessage from "../../../model/SageMessage";
import { AdminRoleType, IAdminRole, TAdminRoleType } from "../../../model/Server";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

function getAdminRoleLabel(adminRole: IAdminRole): TAdminRoleType {
	return <TAdminRoleType>AdminRoleType[adminRole.type || 0];
}

async function serverRoleList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.reactBlock();
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

async function serverRoleSet(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.reactBlock();
	}

	const roleDid = sageMessage.args.findRoleDid("role", true);
	const roleType = sageMessage.args.findEnum<AdminRoleType>(AdminRoleType, "type", true);
	if (!roleDid || !roleType) {
		return sageMessage.reactFailure();
	}

	const guild = sageMessage.discord.guild;
	const guildRole = await sageMessage.discord.fetchGuildRole(roleDid);
	if (!guild || !guildRole) {
		return sageMessage.reactFailure();
	}

	const role = sageMessage.server.getRole(roleType);
	if (!role) {
		const added = await sageMessage.server.addRole(roleType, roleDid);
		return sageMessage.reactSuccessOrFailure(added);
	}
	const updated = await sageMessage.server.updateRole(roleType, roleDid);
	return sageMessage.reactSuccessOrFailure(updated);
}

async function serverRoleRemove(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.reactBlock();
	}

	const roleType = sageMessage.args.findEnum<AdminRoleType>(AdminRoleType, "type", true);
	if (!roleType) {
		return sageMessage.reactFailure();
	}

	const removed = await sageMessage.server.removeRole(roleType);
	return sageMessage.reactSuccessOrFailure(removed);
}

//TODO: remove roles by mentioning them
//TODO: have a generic set of role commands that dyanmically figure out game or server roletype

export default function register(): void {
	registerAdminCommand(serverRoleList, "server-role-list");
	registerAdminCommandHelp("Admin", "Server", "server role list");

	registerAdminCommand(serverRoleSet, "server-role-set");
	registerAdminCommandHelp("Admin", "Server", "server role set {@RoleMention} {ServerRoleType}");

	registerAdminCommand(serverRoleRemove, "server-role-remove", "server-role-delete", "server-role-unset");
	registerAdminCommandHelp("Admin", "Server", "server role remove {ServerRoleType}");
}
