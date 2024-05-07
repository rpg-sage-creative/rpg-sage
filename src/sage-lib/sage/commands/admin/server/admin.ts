import { forEachAsync, mapAsync } from "@rsc-utils/async-array-utils";
import { toHumanReadable } from "@rsc-utils/discord-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { User } from "discord.js";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { AdminRoleType, type IAdminUser } from "../../../model/Server.js";
import { createAdminRenderableContent } from "../../cmd.js";
import { isDefined } from "@rsc-utils/type-utils";
import { SageCommand } from "../../../model/SageCommand.js";


type TAdminUser = IAdminUser & { discordUser: User };

async function renderUser(renderableContent: RenderableContent, user: TAdminUser): Promise<void> {
	renderableContent.appendTitledSection(`<b>${toHumanReadable(user?.discordUser) || "<i>Unknown</i>"}</b>`);
	// renderableContent.append(`<b>User Id</b> ${user.discordUser?.id}`);
	// renderableContent.append(`<b>Username</b> ${user?.discordUser?.username || "<i>Unknown</i>"}`);
	renderableContent.append(`<b>Role</b> ${AdminRoleType[user.role] ?? "<i>Unknown</i>"}`);
}

async function adminList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.whisper(`Sorry, you aren't allowed to access this command.`);
	}

	let users: TAdminUser[] = await mapAsync(sageMessage.server.admins, async admin => {
		return {
			discordUser: await sageMessage.discord.fetchUser(admin.did),
			...admin
		} as TAdminUser;
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
			await forEachAsync(users, async user => renderUser(renderableContent, user));
		} else {
			renderableContent.append(`<blockquote>No Admins Found!</blockquote>`);
		}
		await sageMessage.send(renderableContent);
	}

	return Promise.resolve();
}

async function adminAdd(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.whisper(`Sorry, you aren't allowed to access this command.`);
	}

	const userDid = await sageMessage.args.removeAndReturnUserDid();
	const roleType = sageMessage.args.getEnum(AdminRoleType, "type") ?? null;
	const hasRoleType = isDefined(roleType);
	if (!userDid || !hasRoleType) {
		const message = [
			`Sorry, we cannot process your request:`,
			userDid ? null : `- Missing/Invalid User.`,
			hasRoleType ? null : `- Invalid AdminRoleType: ${sageMessage.args.getString("type") ?? "*not found*"}.`,
			`Example: \`sage! admin add @UserMention type="GameAdmin"\``
		].filter(isDefined).join("\n");
		return sageMessage.whisperWikiHelp({ message, page:`Sage-Admin-Tiers` });
	}

	const saved = await sageMessage.server.addAdmin(userDid, roleType);
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable to add your admin!`);
	}

	return sageMessage.reactSuccess();
}

async function adminUpdate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.whisper(`Sorry, you aren't allowed to access this command.`);
	}

	const userDid = await sageMessage.args.removeAndReturnUserDid();
	const roleType = sageMessage.args.getEnum(AdminRoleType, "type") ?? null;
	const hasRoleType = isDefined(roleType);
	if (!userDid || !hasRoleType) {
		const message = [
			`Sorry, we cannot process your request:`,
			userDid ? null : `- Missing/Invalid User.`,
			hasRoleType ? null : `- Invalid AdminRoleType: ${sageMessage.args.getString("type") ?? "*not found*"}.`,
			`Example: \`sage! admin update @UserMention type="GameAdmin"\``
		].filter(isDefined).join("\n");
		return sageMessage.whisperWikiHelp({ message, page:`Sage-Admin-Tiers` });
	}

	const saved = await sageMessage.server.updateAdminRole(userDid, roleType);
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable to update your admin!`);
	}

	return sageMessage.reactSuccess();
}

async function adminRemove(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminSage) {
		return sageMessage.whisper(`Sorry, you aren't allowed to access this command.`);
	}

	const userDid = await sageMessage.args.removeAndReturnUserDid();
	if (!userDid) {
		const message = `Sorry, we cannot process your request:\n- Missing/Invalid User.\nExample: \`sage! admin remove @UserMention\``;
		return sageMessage.whisperWikiHelp({ message, page:`Sage-Admin-Tiers` });
	}

	const saved = await sageMessage.server.removeAdmin(userDid);
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable to remove your admin!`);
	}

	return sageMessage.reactSuccess();
}

async function adminHelp(sageCommand: SageCommand): Promise<void> {
	const isHelp = sageCommand.isCommand("admin", "help");
	const message = [
		`Usage Examples:`,
		"```",
		`sage! admin add @UserMention type="GameAdmin"`,
		`sage! admin update @UserMention type="ServerAdmin"`,
		`sage! admin remove @UserMention`,
		"```",
	].join("\n");
	await sageCommand.whisperWikiHelp({ isHelp, message, page:"Sage-Admin-Tiers" });
}

export function registerAdmin(): void {
	registerListeners({ commands:["admin|list"], message:adminList });
	registerListeners({ commands:["admin|add", "add|admin"], message:adminAdd });
	registerListeners({ commands:["admin|update", "update|admin"], message:adminUpdate });
	registerListeners({ commands:["admin|remove", "remove|admin"], message:adminRemove });
	registerListeners({ commands:["admin", "admin|help"], message:adminHelp });
}
