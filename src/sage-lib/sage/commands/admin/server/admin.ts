import type { User } from "discord.js";
import { Collection } from "../../../../../sage-utils/ArrayUtils";
import type { RenderableContent } from "../../../../../sage-utils/RenderUtils";
import type { SageMessage } from "../../../model/SageMessage";
import { type IAdminUser, AdminRoleType } from "../../../model/Server";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";


type TAdminUser = IAdminUser & { discordUser: User };

async function renderUser(renderableContent: RenderableContent, user: TAdminUser): Promise<void> {
	renderableContent.appendTitledSection(`<b>${user?.discordUser?.tag || "<i>Unknown</i>"}</b>`);
	// renderableContent.append(`<b>User Id</b> ${user.discordUser?.id}`);
	// renderableContent.append(`<b>Username</b> ${user?.discordUser?.username || "<i>Unknown</i>"}`);
	renderableContent.append(`<b>Role</b> ${AdminRoleType[user.role] ?? "<i>Unknown</i>"}`);
}

async function adminList(sageMessage: SageMessage<true>): Promise<void> {
	let users: TAdminUser[] = <TAdminUser[]>await Collection.mapAsync(sageMessage.server.admins, async admin => {
		return {
			discordUser: await sageMessage.discord.fetchUser(admin.did),
			...admin
		};
	});
	if (users) {
		const filter = sageMessage.args.unkeyedValues().join(" ");
		if (filter && users.length) {
			const lower = filter.toLowerCase();
			users = users.filter(user => user?.discordUser?.username?.toLowerCase().includes(lower));
		}

		const renderableContent = createAdminRenderableContent(sageMessage.server);
		renderableContent.setTitle(`<b>Sage Admin List</b>`);
		if (users.length) {
			await Collection.forEachAsync(users, async user => renderUser(renderableContent, user));
		} else {
			renderableContent.append(`<blockquote>No Admins Found!</blockquote>`);
		}
		await sageMessage.send(renderableContent);
	}
	return Promise.resolve();
}

async function adminAdd(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminServer("Add Sage Admin");
	if (denial) {
		return denial;
	}

	const userDid = sageMessage.args.findUserDid("user");
	const roleType = sageMessage.args.findEnum(AdminRoleType, "type");
	if (!userDid || !roleType) {
		return sageMessage.reactFailure(`You must provide user and role type. Ex: sage!!admin add user="@User" role="GameAdmin"`);
	}

	const saved = await sageMessage.server.setAdmin(userDid, roleType);
	return sageMessage.reactSuccessOrFailure(saved, "Sage Admin Added", "Unknown Error; Sage Admin NOT Added!");
}

async function adminRemove(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminServer("Remove Sage Admin");
	if (denial) {
		return denial;
	}

	const userDid = sageMessage.args.findUserDid("user", true);
	if (!userDid) {
		return sageMessage.reactFailure(`You must provide a user to remove. Ex: sage!!admin remove user="@User"`);
	}

	const saved = await sageMessage.server.setAdmin(userDid, null);
	return sageMessage.reactSuccessOrFailure(saved, "Sage Admin Removed", "Unknown Error; Sage Admin NOT Removed!");
}

export function register(): void {
	registerAdminCommand(adminList, "admin-list");

	registerAdminCommand(adminAdd, "admin-add");
	registerAdminCommandHelp("Admin", "Admin", `admin add user="@User" role="GameAdmin"`);

	registerAdminCommand(adminRemove, "admin-remove");
	registerAdminCommandHelp("Admin", "Admin", `admin remove user="@User"`);
}
