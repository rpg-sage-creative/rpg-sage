import type SageMessage from "../../../model/SageMessage";
import type User from "../../../model/User";
import { DialogType } from "../../../repo/base/channel";
import { createAdminRenderableContent, registerAdminCommand, renderCount } from "../../cmd";

async function userCount(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.isSuperUser) {
		const users = await sageMessage.sageCache.users.getAll();
		return renderCount(sageMessage, "Users", users.length);
	}
}

async function userUpdate(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("Update User");
	if (denial) {
		return denial;
	}

	const defaultDialogType = sageMessage.args.getEnum<DialogType>(DialogType, "dialogType");
	const defaultSagePostType = sageMessage.args.getEnum<DialogType>(DialogType, "sagePostType");
	const updated = await sageMessage.actor.s.update({ defaultDialogType, defaultSagePostType });
	if (updated) {
		return userDetails(sageMessage);
	}
	return sageMessage.reactFailure("Unknown Error; User NOT Updated!");
}

async function userDetails(sageMessage: SageMessage): Promise<void> {
	let user: User | null = sageMessage.actor.s;
	if (sageMessage.isSuperUser) {
		const userDid = sageMessage.args.findUserDid("user", true);
		if (userDid) {
			user = await sageMessage.sageCache.users.getByDid(userDid);
		}
		if (!user) {
			const userId = sageMessage.args.findUuid("user", true);
			user = await sageMessage.sageCache.users.getById(userId);
		}
		if (!user) {
			user = sageMessage.actor.s;
		}
	}

	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>user-details</b>`);
	if (user) {
		const discordUser = await sageMessage.discord.fetchUser(user.did);
		if (discordUser) {
			renderableContent.setTitle(`<b>@${discordUser.tag}</b>`);
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

export default function register(): void {
	registerAdminCommand(userCount, "user-count");
	registerAdminCommand(userDetails, "user-details");
	registerAdminCommand(userUpdate, "user-set", "user-update");
}
