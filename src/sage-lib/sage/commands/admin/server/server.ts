import { DicePostType, DiceSortType, getCritMethodText } from "@rsc-sage/types";
import { mapAsync, type Optional, type RenderableContent } from "@rsc-utils/core-utils";
import type { Role } from "discord.js";
import { DiceOutputType, DiceSecretMethodType } from "../../../../../sage-dice/index.js";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { Server } from "../../../model/Server.js";
import { AdminRoleType, type IAdminRole } from "../../../model/Server.js";
import { DialogType } from "../../../repo/base/IdRepository.js";
import { createAdminRenderableContent } from "../../cmd.js";

function serverDetailsDefaultTypes(renderableContent: RenderableContent, server: Server): void {
	renderableContent.append(`<b>Default Dialog Type</b> ${DialogType[server.dialogPostType!] ?? "<i>unset (Embed)</i>"}`);
	renderableContent.append(`<b>Default Game Type</b> ${server.gameSystem?.name ?? "<i>unset (None)</i>"}`);
	const critMethodText = getCritMethodText(server.gameSystemType, server.diceCritMethodType);
	renderableContent.append(`<b>Default Dice Crit Method Type</b> ${critMethodText}`);
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
		const serverId = sageMessage.args.getIdType("server");
		if (serverId) {
			server = await sageMessage.sageCache.getOrFetchServer(serverId);
		}
	}
	if (!server) {
		return sageMessage.replyStack.whisper("No Server Found!");
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
	await sageMessage.replyStack.reply(renderableContent);
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

	const updated = await server.update(serverOptions);
	return sageMessage.reactSuccessOrFailure(updated);
}

export function registerServer(): void {
	registerListeners({ commands:["server|details"], message:serverDetails });
	registerListeners({ commands:["server|update"], message:serverUpdate });
}
