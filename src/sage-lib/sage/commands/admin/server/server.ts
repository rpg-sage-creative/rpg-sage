import { DicePostType, DiceSortType, GameSystemType } from "@rsc-sage/types";
import { mapAsync } from "@rsc-utils/array-utils";
import type { Optional } from "@rsc-utils/core-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { Role } from "discord.js";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../../sage-dice/index.js";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { Server } from "../../../model/Server.js";
import { AdminRoleType, type IAdminRole } from "../../../model/Server.js";
import { DialogType } from "../../../repo/base/IdRepository.js";
import { createAdminRenderableContent } from "../../cmd.js";

async function serverInit(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.server) {
		return Promise.resolve();
	}
	if (!sageMessage.isOwner && !sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}

	const saved = await sageMessage.caches.servers.initializeServer(sageMessage.message.guild);
	return sageMessage.reactSuccessOrFailure(saved);
}

function serverDetailsDefaultTypes(renderableContent: RenderableContent, server: Server): void {
	renderableContent.append(`<b>Default Dialog Type</b> ${DialogType[server.dialogPostType!] ?? "<i>unset (Embed)</i>"}`);
	renderableContent.append(`<b>Default Game Type</b> ${GameSystemType[server.gameSystemType!] ?? "<i>unset (None)</i>"}`);
	if ([GameSystemType.DnD5e, GameSystemType.PF2e, GameSystemType.SF2e].includes(server.gameSystemType ?? GameSystemType.None)) {
		renderableContent.append(`<b>Default Crit Method Type</b> ${CritMethodType[server.diceCritMethodType!] ?? "<i>unset (x2)</i>"}`);
	}else {
		renderableContent.append(`<b>Default Crit Method Type</b> <i>only for PF2e, SF2e, and DnD5e</i>`);
	}
	renderableContent.append(`<b>Default Dice Output Type</b> ${DiceOutputType[server.diceOutputType!] ?? "<i>unset (M)</i>"}`);
	renderableContent.append(`<b>Default Dice Post Type</b> ${DicePostType[server.dicePostType!] ?? "<i>unset (Post)</i>"}`);
	renderableContent.append(`<b>Default Dice Secret Method Type</b> ${DiceSecretMethodType[server.diceSecretMethodType!] ?? "<i>unset (Ignore)</i>"}`);
	renderableContent.append(`<b>Default Dice Sort Type</b> ${DiceSortType[server.diceSortType!] ?? "<i>unset (None)</i>"}`);
}
type TRole = { role:IAdminRole, discordRole:Role };
async function serverDetails(sageMessage: SageMessage): Promise<void> {
	let server: Optional<Server> = sageMessage.server;
	if (server && !sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	if (!server && sageMessage.isSuperUser) {
		server = await sageMessage.args.removeAndReturnServer();
	}
	if (!server) {
		return sageMessage.reactFailure();
	}

	const roles = <TRole[]>await mapAsync(server.roles, async role => {
		return {
			role: role,
			discordRole: await sageMessage.discord.fetchGuildRole(role.did)
		};
	});

	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>Server Details</b>`);
	if (server) {
		renderableContent.append(server.id);
		const guild = server.discord?.guild;
		if (guild) {
			renderableContent.setThumbnailUrl(guild.iconURL());
			renderableContent.setTitle(`${guild.name} (${guild.nameAcronym})`);
			renderableContent.append(`<b>Server Id</b> ${guild.id}`);
			renderableContent.append(`<b>Available</b> ${guild.available}`);
			// renderableContent.append(`<b>Region</b> ${guild.region}`);
			renderableContent.append(`<b>MemberCount</b> ${guild.memberCount}`);
			serverDetailsDefaultTypes(renderableContent, server);
			renderableContent.append(`<b>Sage Roles</b> ${!roles.length ? "<i>none set</i>" : roles.map(role => `@${role.discordRole.name} (${AdminRoleType[role.role.type]})`).join(", ")}`);
		} else {
			renderableContent.append(`<b>Server Id</b> ${server.did || "<i>NOT SET</i>"}`);
			renderableContent.append(`<b>Status</b> ${"<i>NOT FOUND</i>"}`);
		}
	} else {
		renderableContent.append(`<blockquote>Server Not Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

async function serverUpdate(sageMessage: SageMessage): Promise<void> {
	const { server } = sageMessage;
	if (server && !sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	if (!server) {
		return sageMessage.reactFailure();
	}

	const serverOptions = sageMessage.args.getServerOptions();
	if (!serverOptions) {
		return sageMessage.reactFailure();
	}

	const updated = await sageMessage.server.update(serverOptions);
	return sageMessage.reactSuccessOrFailure(updated);
}

export function registerServer(): void {
	registerListeners({ commands:["server|init"], message:serverInit });
	registerListeners({ commands:["server|details"], message:serverDetails });
	registerListeners({ commands:["server|update"], message:serverUpdate });
}
