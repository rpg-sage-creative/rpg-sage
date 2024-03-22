import { DialogPostType } from "@rsc-sage/types";
import { toHumanReadable } from "@rsc-utils/discord-utils";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { User as SUser } from "../../../model/User.js";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd.js";
import { registerAdminCommandHelp } from "../../help.js";
import { renderCount } from "../../helpers/renderCount.js";

async function userCount(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	const users = await sageMessage.sageCache.users.getAll();
	return renderCount(sageMessage, "Users", users.length);
}

async function userUpdate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowAdmin) {
		return sageMessage.reactBlock();
	}
	const dialogPostType = sageMessage.args.getEnum(DialogPostType, "dialogPostType");
	const sagePostType = sageMessage.args.getEnum(DialogPostType, "sagePostType");
	const updated = await sageMessage.sageUser.update({ dialogPostType, sagePostType });
	if (updated) {
		return userDetails(sageMessage);
	}
	return sageMessage.reactSuccessOrFailure(updated);
}

async function userDetails(sageMessage: SageMessage): Promise<void> {
	let user: SUser | null = sageMessage.sageUser;
	if (sageMessage.isSuperUser) {
		const userDid = sageMessage.args.getUserId("user");
		if (userDid) {
			user = await sageMessage.sageCache.users.getByDid(userDid);
		}
		if (!user) {
			const userId = sageMessage.args.getUuid("user");
			user = await sageMessage.sageCache.users.getById(userId);
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

		const dialogPostType = DialogPostType[user.dialogPostType!] ?? `<i>unset (Embed)</i>`;
		renderableContent.append(`<b>Preferred Dialog Type</b> ${dialogPostType}`);

		const sagePostType = DialogPostType[user.sagePostType!] ?? `<i>unset (Embed)</i>`;
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

	registerAdminCommand(userDetails, "user-details");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user details *@UserMention*");
	registerAdminCommandHelp("Admin", "SuperUser", "User", "user details *uuid*");

	registerAdminCommand(userUpdate, "user-set", "user-update");
}
