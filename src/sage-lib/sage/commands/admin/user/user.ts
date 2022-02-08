import type * as Discord from "discord.js";
import utils, { Optional } from "../../../../../sage-utils";
import type SageMessage from "../../../model/SageMessage";
import type User from "../../../model/User";
import { renderCount, registerAdminCommand, createAdminRenderableContent } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

async function userCount(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	const users = await sageMessage.caches.users.getAll();
	return renderCount(sageMessage, "Users", users.length);
}

async function renderUser(renderableContent: utils.RenderUtils.RenderableContent, user: User, discordUser: Optional<Discord.User>): Promise<void> {
	renderableContent.appendTitledSection(`<b>${discordUser?.tag || "<i>Unknown</i>"}</b>`);
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
			users = await utils.ArrayUtils.Async.filter(users, async user => {
				const discordUser = await sageMessage.discord.fetchUser(user.did);
				return discordUser?.username?.toLowerCase().includes(lower) ?? false;
			});
		}

		const renderableContent = createAdminRenderableContent(sageMessage.bot);
		renderableContent.setTitle(`<b>user-list</b>`);
		if (users.length) {
			await utils.ArrayUtils.Async.forEach(users, async user => renderUser(renderableContent, user, await sageMessage.discord.fetchUser(user.did)));
		} else {
			renderableContent.append(`<blockquote>No Users Found!</blockquote>`);
		}
		await sageMessage.send(renderableContent);
	}
	return Promise.resolve();
}

async function userDetails(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}

	const userDid = await sageMessage.args.removeAndReturnUserDid();
	let user = await sageMessage.caches.users.getByDid(userDid);
	if (!user) {
		const userId = sageMessage.args.removeAndReturnUuid();
		user = await sageMessage.caches.users.getById(userId);
	}

	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>user-details</b>`);
	if (user) {
		renderableContent.append(user.id);

		const discordUser = await sageMessage.discord.fetchUser(user.did);
		if (discordUser) {
			renderableContent.setTitle(`<b>${discordUser.username}</b>`);
			renderableContent.setThumbnailUrl(discordUser.displayAvatarURL());
			renderableContent.append(`<b>Username</b> ${discordUser.tag}`);
			renderableContent.append(`<b>User Id</b> ${discordUser.id}`);
			//TODO: sort out presence
			// renderableContent.append(`<b>Status</b> ${discordUser.presence.status}`);
			// const lastMessage = discordUser.lastMessage;
			// if (lastMessage) {
			// 	renderableContent.append(`<b>Last Message Guild</b> ${lastMessage.guild && lastMessage.guild.name || "non-guild message"}`);
			// 	renderableContent.append(`<b>Last Message Date</b> ${lastMessage.createdAt.toUTCString()}`);
			// }
		} else {
			renderableContent.setTitle(`<b>Unknown User</b>`);
			renderableContent.append(`<b>Username</b> ${"<i>UNKNOWN</i>"}`);
			renderableContent.append(`<b>User Id</b> ${user.did || "<i>NOT SET</i>"}`);
			renderableContent.append(`<b>Status</b> ${"<i>NOT FOUND</i>"}`);
		}
		// TODO: List any games, gameRoles, servers, serverRoles!
	} else {
		renderableContent.append(`<blockquote>User Not Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

export default function register(): void {
	registerAdminCommand(userCount, "user-count");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user count");

	registerAdminCommand(userList, "user-list");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user list");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user list {optionalNameFilter}");

	registerAdminCommand(userDetails, "user-details");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user details {@UserMention}");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user details {UserId}");
}
