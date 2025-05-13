import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { AdminRoleType, type IAdminRole, type TAdminRoleType } from "../../../model/Server.js";
import { createAdminRenderableContent } from "../../cmd.js";

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
	if (!server) {
		return sageMessage.reactBlock();
	}

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

	const server = sageMessage.server;
	if (!server) {
		return sageMessage.reactBlock();
	}

	const roleDid = await sageMessage.args.getRoleId("role");
	const roleType = sageMessage.args.getEnum(AdminRoleType, "type");
	if (!roleDid || !roleType) {
		return sageMessage.reactFailure();
	}

	const guild = sageMessage.discord.guild;
	const guildRole = await sageMessage.discord.fetchGuildRole(roleDid);
	if (!guild || !guildRole) {
		return sageMessage.reactFailure();
	}

	const role = server.getRole(roleType);
	if (!role) {
		const added = await server.addRole(roleType, roleDid);
		return sageMessage.reactSuccessOrFailure(added);
	}
	const updated = await server.updateRole(roleType, roleDid);
	return sageMessage.reactSuccessOrFailure(updated);
}

async function serverRoleRemove(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	if (!sageMessage.testServerAdmin()) {
		return sageMessage.reactBlock();
	}

	const server = sageMessage.server;
	if (!server) {
		return sageMessage.reactBlock();
	}

	const roleType = sageMessage.args.getEnum(AdminRoleType, "type");
	if (!roleType) {
		return sageMessage.reactFailure();
	}

	const removed = await server.removeRole(roleType) ?? false;
	return sageMessage.reactSuccessOrFailure(removed);
}

//TODO: remove roles by mentioning them
//TODO: have a generic set of role commands that dyanmically figure out game or server roletype

export function registerRole(): void {
	registerListeners({ commands:["server|role|list"], message:serverRoleList });
	registerListeners({ commands:["server|role|set"], message:serverRoleSet });
	registerListeners({ commands:["server|role|remove", "server|role|delete", "server|role|unset"], message:serverRoleRemove });
}
