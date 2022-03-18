import type * as Discord from "discord.js";
import utils from "../../../../../sage-utils";
import type SageMessage from "../../../model/SageMessage";
import { type IAdminUser, AdminRoleType } from "../../../model/Server";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";


type TAdminUser = IAdminUser & { discordUser: Discord.User };

async function renderUser(renderableContent: utils.RenderUtils.RenderableContent, user: TAdminUser): Promise<void> {
	renderableContent.appendTitledSection(`<b>${user?.discordUser?.tag || "<i>Unknown</i>"}</b>`);
	// renderableContent.append(`<b>User Id</b> ${user.discordUser?.id}`);
	// renderableContent.append(`<b>Username</b> ${user?.discordUser?.username || "<i>Unknown</i>"}`);
	renderableContent.append(`<b>Role</b> ${AdminRoleType[user.role] ?? "<i>Unknown</i>"}`);
}

async function adminList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.reactBlock();
	}
	let users: TAdminUser[] = <TAdminUser[]>await utils.ArrayUtils.Collection.mapAsync(sageMessage.server.admins, async admin => {
		return {
			discordUser: await sageMessage.discord.fetchUser(admin.did),
			...admin
		};
	});
	if (users) {
		const filter = sageMessage.args.join(" ");
		if (filter && users.length) {
			const lower = filter.toLowerCase();
			users = users.filter(user => user?.discordUser?.username?.toLowerCase().includes(lower));
		}

		const renderableContent = createAdminRenderableContent(sageMessage.server);
		renderableContent.setTitle(`<b>admin-list</b>`);
		if (users.length) {
			await utils.ArrayUtils.Collection.forEachAsync(users, async user => renderUser(renderableContent, user));
		} else {
			renderableContent.append(`<blockquote>No Admins Found!</blockquote>`);
		}
		await sageMessage.send(renderableContent);
	}
	return Promise.resolve();
}

function getAdminRoleType(command: string): AdminRoleType | null {
	if (command.includes("game-admin")) {
		return AdminRoleType.GameAdmin;
	}
	if (command.includes("server-admin")) {
		return AdminRoleType.ServerAdmin;
	}
	return null;
}

async function adminAdd(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.reactBlock();
	}

	const userDid = await sageMessage.args.removeAndReturnUserDid();
	if (!userDid) {
		return sageMessage.reactFailure();
	}

	const roleType = getAdminRoleType(sageMessage.command) ?? sageMessage.args.removeAndReturnEnum(AdminRoleType) ?? null;
	if (roleType === null) {
		return sageMessage.reactFailure();
	}

	const added = await sageMessage.server.addAdmin(userDid, roleType);
	return sageMessage.reactSuccessOrFailure(added);
}

async function adminUpdate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.reactBlock();
	}

	const userDid = await sageMessage.args.removeAndReturnUserDid();
	if (!userDid) {
		return sageMessage.reactFailure();
	}

	const roleType = getAdminRoleType(sageMessage.command) ?? sageMessage.args.removeAndReturnEnum(AdminRoleType) ?? null;
	if (roleType === null) {
		return sageMessage.reactFailure();
	}

	const updated = await sageMessage.server.updateAdminRole(userDid, roleType);
	return sageMessage.reactSuccessOrFailure(updated);
}

async function adminRemove(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.reactBlock();
	}

	const userDid = await sageMessage.args.removeAndReturnUserDid();
	if (!userDid) {
		return sageMessage.reactFailure();
	}

	const removed = await sageMessage.server.removeAdmin(userDid);
	return sageMessage.reactSuccessOrFailure(removed);
}

export default function register(): void {
	registerAdminCommand(adminList, "admin-list");
	registerAdminCommandHelp("Admin", "SuperUser", "Admin", "admin list");
	registerAdminCommandHelp("Admin", "SuperUser", "Admin", "admin list {optionalNameFilter}");

	registerAdminCommand(adminAdd, "admin-add", "add-admin", "add-game-admin", "add-server-admin");
	registerAdminCommandHelp("Admin", "Admin", "admin add {@UserMention} {GameAdmin|ServerAdmin|SageAdmin}");

	registerAdminCommand(adminUpdate, "admin-update");
	registerAdminCommandHelp("Admin", "Admin", "admin update {@UserMention} {GameAdmin|ServerAdmin|SageAdmin}");

	registerAdminCommand(adminRemove, "admin-remove");
	registerAdminCommandHelp("Admin", "Admin", "admin remove {@UserMention}");
}
