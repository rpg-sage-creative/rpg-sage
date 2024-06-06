import { DicePostType, GameSystemType } from "@rsc-sage/types";
import { mapAsync } from "@rsc-utils/array-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { Optional } from "@rsc-utils/core-utils";
import type { Role } from "discord.js";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../../sage-dice/index.js";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { Server } from "../../../model/Server.js";
import { AdminRoleType, IAdminRole } from "../../../model/Server.js";
import { DialogType } from "../../../repo/base/IdRepository.js";
import { createAdminRenderableContent } from "../../cmd.js";

async function serverCount(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	const servers = await sageMessage.caches.servers.getAll();
	const active = servers.filter(server => server.isActive);
	const guilds = await sageMessage.caches.discord.client.guilds.fetch();

	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>Server Count</b>`);
	renderableContent.append(`<b>Total</b> ${servers.length}`);
	renderableContent.append(`<b>Active</b> ${active.length}`);
	renderableContent.append(`<b>Inactive</b> ${servers.length - active.length}`);
	renderableContent.append(`<b>Connected</b> ${guilds.size}`);
	await sageMessage.send(renderableContent);
	// return renderCount(sageMessage, "Servers", servers.length, active.length);
}

async function serverList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	let servers = await sageMessage.caches.servers.getAll();
	if (servers) {
		const filter = sageMessage.args.join(" ");
		if (filter && servers.length) {
			const lower = filter.toLowerCase();
			servers = servers.filter(server => server.discord?.guild?.name.toLowerCase().includes(lower));
		}

		const renderableContent = createAdminRenderableContent(sageMessage.bot);
		renderableContent.setTitle(`<b>server-list</b>`);
		if (servers.length) {
			for (const server of servers) {
				const title = `<b>${server.discord?.guild?.name} (${server.discord?.guild?.nameAcronym})</b>`;
				const serverId = `<b>UUID</b> ${server.id}`;
				const serverDid = `<b>Server Id</b> ${server.did}`;
				renderableContent.appendTitledSection(title, serverDid, serverId);
			}
		} else {
			renderableContent.append(`<blockquote>No Servers Found!</blockquote>`);
		}
		return <any>sageMessage.send(renderableContent);
	}
	return Promise.resolve();
}

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
	if (server.gameSystemType === GameSystemType.PF2e) {
		renderableContent.append(`<b>Default Crit Method Type</b> ${CritMethodType[server.diceCritMethodType!] ?? "<i>unset (x2)</i>"}`);
	}
	renderableContent.append(`<b>Default Dice Output Type</b> ${DiceOutputType[server.diceOutputType!] ?? "<i>unset (M)</i>"}`);
	renderableContent.append(`<b>Default Dice Post Type</b> ${DicePostType[server.dicePostType!] ?? "<i>unset (Post)</i>"}`);
	renderableContent.append(`<b>Default Dice Secret Method Type</b> ${DiceSecretMethodType[server.diceSecretMethodType!] ?? "<i>unset (Ignore)</i>"}`);
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

	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>server-details</b>`);
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

	const serverOptions = sageMessage.args.getServerOptions();
	if (!serverOptions) {
		return sageMessage.reactFailure();
	}

	const updated = await sageMessage.server.update(serverOptions);
	return sageMessage.reactSuccessOrFailure(updated);
}

export function registerServer(): void {
	registerListeners({ commands:["server|count"], message:serverCount });
	registerListeners({ commands:["server|list"], message:serverList });
	registerListeners({ commands:["server|init"], message:serverInit });
	registerListeners({ commands:["server|details"], message:serverDetails });
	registerListeners({ commands:["server|update"], message:serverUpdate });
}
