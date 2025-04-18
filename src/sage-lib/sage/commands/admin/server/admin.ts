import { forEachAsync, isDefined, mapAsync, type Snowflake } from "@rsc-utils/core-utils";
import { toHumanReadable } from "@rsc-utils/discord-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { User } from "discord.js";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import { SageCommand } from "../../../model/SageCommand.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { AdminRoleType, type IAdminUser } from "../../../model/Server.js";
import { createAdminRenderableContent } from "../../cmd.js";

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
		const filter = sageMessage.args.getString("filter");
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

type CanAdminResults = {
	canAdminThis: boolean;
	hasRoleType: boolean;
	roleType?: AdminRoleType;
	userId?: Snowflake;
	userRoleType?: AdminRoleType;
};

async function canAdminRoleType(sageMessage: SageMessage, action: "add" | "update" | "remove"): Promise<CanAdminResults> {
	const roleType = sageMessage.args.getEnum(AdminRoleType, "type") ?? undefined;
	const hasRoleType = isDefined(roleType);

	const userId = sageMessage.message.mentions.users.first()?.id as Snowflake;
	const userRoleType = isDefined(userId) ? sageMessage.server.admins.find(admin => admin.did === userId)?.role : undefined;

	let canAdminThis = false;

	if (action === "add" && hasRoleType) {
		switch(roleType) {
			case AdminRoleType.SageAdmin: canAdminThis = await sageMessage.checkCanManageServer(); break; // NOSONAR
			case AdminRoleType.ServerAdmin: canAdminThis = sageMessage.canAdminSage; break; // NOSONAR
			case AdminRoleType.GameAdmin: canAdminThis = sageMessage.canAdminServer; break; // NOSONAR
		}
	}
	if (action === "update" && hasRoleType && isDefined(userRoleType)) {
		if (roleType === AdminRoleType.SageAdmin || userRoleType === AdminRoleType.SageAdmin) {
			canAdminThis = await sageMessage.checkCanManageServer();
		}else if (roleType === AdminRoleType.ServerAdmin || userRoleType === AdminRoleType.ServerAdmin) {
			canAdminThis = sageMessage.canAdminSage;
		}else if (roleType === AdminRoleType.GameAdmin || userRoleType === AdminRoleType.GameAdmin) {
			canAdminThis = sageMessage.canAdminServer;
		}
	}
	if (action === "remove" && isDefined(userRoleType)) {
		switch(userRoleType) {
			case AdminRoleType.SageAdmin: canAdminThis = await sageMessage.checkCanManageServer(); break; // NOSONAR
			case AdminRoleType.ServerAdmin: canAdminThis = sageMessage.canAdminSage; break; // NOSONAR
			case AdminRoleType.GameAdmin: canAdminThis = sageMessage.canAdminServer; break; // NOSONAR
		}
	}

	return {
		hasRoleType,
		roleType,

		userId,
		userRoleType,

		canAdminThis,
	};
}

async function adminAdd(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to access this command.`);
	}

	const { canAdminThis, hasRoleType, roleType, userId } = await canAdminRoleType(sageMessage, "add");

	if (!userId || !hasRoleType) {
		const message = [
			`Sorry, we cannot process your request:`,
			userId ? null : `- Missing/Invalid User.`,
			hasRoleType ? null : `- Invalid AdminRoleType: ${sageMessage.args.getString("type") ?? "*not found*"}.`,
			`Example: \`sage! admin add @UserMention type="GameAdmin"\``
		].filter(isDefined).join("\n");
		return sageMessage.whisperWikiHelp({ message, page:`Sage-Admin-Tiers` });
	}

	if (!canAdminThis) {
		return sageMessage.whisper(`Sorry, you aren't allowed to admin users of that tier.`);
	}

	const saved = await sageMessage.server.addAdmin(userId, roleType!);
	if (typeof(saved) === "number") {
		if (saved !== roleType) {
			const updated = await sageMessage.server.updateAdminRole(userId, roleType!);
			if (updated) {
				return sageMessage.whisper(`That user was a ${AdminRoleType[saved]} and has been updated to ${AdminRoleType[roleType!]}!`);
			}
		}
		return sageMessage.whisper(`That user is already a ${AdminRoleType[saved]}!`);
	}
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable to add your admin!`);
	}

	return sageMessage.reactSuccess();
}

async function adminUpdate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to access this command.`);
	}

	const { canAdminThis, hasRoleType, roleType, userId } = await canAdminRoleType(sageMessage, "update");

	if (!userId || !hasRoleType) {
		const message = [
			`Sorry, we cannot process your request:`,
			userId ? null : `- Missing/Invalid User.`,
			hasRoleType ? null : `- Invalid AdminRoleType: ${sageMessage.args.getString("type") ?? "*not found*"}.`,
			`Example: \`sage! admin update @UserMention type="GameAdmin"\``
		].filter(isDefined).join("\n");
		return sageMessage.whisperWikiHelp({ message, page:`Sage-Admin-Tiers` });
	}

	if (!canAdminThis) {
		return sageMessage.whisper(`Sorry, you aren't allowed to admin users of that tier.`);
	}

	const saved = await sageMessage.server.updateAdminRole(userId, roleType!);
	if (saved === null) {
		return sageMessage.whisper(`Sorry, that user is not an admin!`);
	}
	if (saved === undefined) {
		return sageMessage.whisper(`That user is already a ${AdminRoleType[roleType!]}!`);
	}
	if (!saved) {
		return sageMessage.whisper(`Sorry, we were unable to update your admin!`);
	}

	return sageMessage.reactSuccess();
}

async function adminRemove(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.whisper(`Sorry, you aren't allowed to access this command.`);
	}

	const { canAdminThis, userId } = await canAdminRoleType(sageMessage, "remove");

	if (!userId) {
		const message = `Sorry, we cannot process your request:\n- Missing/Invalid User.\nExample: \`sage! admin remove @UserMention\``;
		return sageMessage.whisperWikiHelp({ message, page:`Sage-Admin-Tiers` });
	}

	if (!canAdminThis) {
		return sageMessage.whisper(`Sorry, you aren't allowed to admin users of that tier.`);
	}

	const saved = await sageMessage.server.removeAdmin(userId);
	if (saved === null) {
		return sageMessage.whisper(`Sorry, that user is not an admin!`);
	}
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
