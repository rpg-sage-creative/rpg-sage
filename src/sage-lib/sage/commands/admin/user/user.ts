import { filterAsync, forEachAsync } from "@rsc-utils/async-array-utils";
import { toHumanReadable } from "@rsc-utils/discord-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { User as DUser } from "discord.js";
import type { SageMessage } from "../../../model/SageMessage";
import type { User as SUser } from "../../../model/User";
import { DialogType } from "../../../repo/base/IdRepository";
import { createAdminRenderableContent, registerAdminCommand, renderCount } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

async function userCount(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	const users = await sageMessage.caches.users.getAll();
	return renderCount(sageMessage, "Users", users.length);
}

async function renderUser(renderableContent: RenderableContent, user: SUser, discordUser: Optional<DUser>): Promise<void> {
	renderableContent.appendTitledSection(`<b>${toHumanReadable(discordUser) || "<i>Unknown</i>"}</b>`);
	renderableContent.append(`<b>User Id</b> ${user.did}`);
	renderableContent.append(`<b>UUID</b> ${user.id}`);
	renderableContent.append(`<b>Username</b> ${discordUser?.username || "<i>Unknown</i>"}`);
}

async function userList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	let users = await sageMessage.caches.users.getAll();
	if (users) {
		const filter = sageMessage.args.join(" ");
		if (filter && users.length) {
			const lower = filter.toLowerCase();
			users = await filterAsync(users, async user => {
				const discordUser = await sageMessage.discord.fetchUser(user.did);
				return discordUser?.username?.toLowerCase().includes(lower) ?? false;
			});
		}

		const renderableContent = createAdminRenderableContent(sageMessage.bot);
		renderableContent.setTitle(`<b>user-list</b>`);
		if (users.length) {
			await forEachAsync(users, async user => renderUser(renderableContent, user, await sageMessage.discord.fetchUser(user.did)));
		} else {
			renderableContent.append(`<blockquote>No Users Found!</blockquote>`);
		}
		await sageMessage.send(renderableContent);
	}
	return Promise.resolve();
}

async function userUpdate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin) {
		return sageMessage.reactBlock();
	}
	const dialogType = sageMessage.args.removeAndReturnDialogType();
	const sagePostType = sageMessage.args.removeAndReturnSagePostType();
	const updated = await sageMessage.sageUser.update({ dialogType, sagePostType });
	if (updated) {
		return userDetails(sageMessage);
	}
	return sageMessage.reactSuccessOrFailure(updated);
}

async function userDetails(sageMessage: SageMessage): Promise<void> {
	let user: SUser | null = sageMessage.sageUser;
	if (sageMessage.isSuperUser) {
		const userDid = await sageMessage.args.removeAndReturnUserDid();
		if (userDid) {
			user = await sageMessage.caches.users.getByDid(userDid);
		}
		if (!user) {
			const userId = sageMessage.args.removeAndReturnUuid();
			user = await sageMessage.caches.users.getById(userId);
		}
		if (!user) {
			user = sageMessage.sageUser;
		}
	}

	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>user-details</b>`);
	if (user) {
		const discordUser = await sageMessage.discord.fetchUser(user.did);
		if (discordUser) {
			renderableContent.setTitle(`<b>${toHumanReadable(discordUser)}</b>`);
			renderableContent.append(`<b>Discord Id</b> ${discordUser.id}`);
			renderableContent.setThumbnailUrl(discordUser.displayAvatarURL());
			//TODO: sort out presence
			// renderableContent.append(`<b>Status</b> ${discordUser.presence.status}`);
			// const lastMessage = discordUser.lastMessage;
			// if (lastMessage) {
			// 	renderableContent.append(`<b>Last Message Guild</b> ${lastMessage.guild && lastMessage.guild.name || "non-guild message"}`);
			// 	renderableContent.append(`<b>Last Message Date</b> ${lastMessage.createdAt.toUTCString()}`);
			// }
		} else {
			// renderableContent.setTitle(`<b>Unknown User</b>`);
			// renderableContent.append(`<b>Username</b> ${"<i>UNKNOWN</i>"}`);
			renderableContent.append(`<b>Discord Id</b> ${user.did || "<i>NOT SET</i>"}`);
			renderableContent.append(`<b>Status</b> ${"<i>NOT FOUND</i>"}`);
		}

		renderableContent.append("");
		renderableContent.append(`<b>RPG Sage Id</b> ${user.id}`);

		const dialogType = DialogType[user.defaultDialogType!] ?? `<i>unset (Embed)</i>`;
		renderableContent.append(`<b>Preferred Dialog Type</b> ${dialogType}`);

		const sagePostType = DialogType[user.defaultSagePostType!] ?? `<i>unset (Embed)</i>`;
		renderableContent.append(`<b>Preferred Sage Post Type</b> ${sagePostType}`);

		// TODO: List any games, gameRoles, servers, serverRoles!
	} else {
		renderableContent.append(`<blockquote>User Not Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

export function registerUser(): void {
	registerAdminCommand(userCount, "user-count");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user count");

	registerAdminCommand(userList, "user-list");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user list");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user list {optionalNameFilter}");

	registerAdminCommand(userDetails, "user-details");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user details {@UserMention}");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user details {UserId}");

	registerAdminCommand(userUpdate, "user-set", "user-update");
}
