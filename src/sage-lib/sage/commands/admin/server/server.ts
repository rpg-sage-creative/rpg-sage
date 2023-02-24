import type * as Discord from "discord.js";
import utils, { Optional } from "../../../../../sage-utils";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../../sage-dice";
import type SageMessage from "../../../model/SageMessage";
import type Server from "../../../model/Server";
import { AdminRoleType, IAdminRole } from "../../../model/Server";
import { createAdminRenderableContent, registerAdminCommand, renderCount } from "../../cmd";
import { DicePostType } from "../../dice";
import { registerAdminCommandHelp } from "../../help";
import { DialogType } from "../../../repo/base/channel";
import { GameType } from "../../../../../sage-common";

async function serverCount(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	const servers = await sageMessage.caches.servers.getAll();
	const active = servers.filter(server => server.isActive);
	return renderCount(sageMessage, "Servers", servers.length, active.length);
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
	if (!sageMessage.isServerOwner && !sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}

	const saved = await sageMessage.caches.servers.initializeServer(sageMessage.message.guild);
	return sageMessage.reactSuccessOrFailure(saved);
}

function serverDetailsDefaultTypes(renderableContent: utils.RenderUtils.RenderableContent, server: Server): void {
	renderableContent.append(`<b>Default Dialog Type</b> ${DialogType[server.defaultDialogType!] ?? "<i>unset (Embed)</i>"}`);
	renderableContent.append(`<b>Default Game Type</b> ${GameType[server.defaultGameType!] ?? "<i>unset (None)</i>"}`);
	if (server.defaultGameType === GameType.PF2e) {
		renderableContent.append(`<b>Default Crit Method Type</b> ${CritMethodType[server.defaultCritMethodType!] ?? "<i>unset (x2)</i>"}`);
	}
	renderableContent.append(`<b>Default Dice Output Type</b> ${DiceOutputType[server.defaultDiceOutputType!] ?? "<i>unset (M)</i>"}`);
	renderableContent.append(`<b>Default Dice Post Type</b> ${DicePostType[server.defaultDicePostType!] ?? "<i>unset (Post)</i>"}`);
	renderableContent.append(`<b>Default Dice Secret Method Type</b> ${DiceSecretMethodType[server.defaultDiceSecretMethodType!] ?? "<i>unset (Ignore)</i>"}`);
}
type TRole = { role:IAdminRole, discordRole:Discord.Role };
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

	const roles = <TRole[]>await utils.ArrayUtils.Collection.mapAsync(server.roles, async role => {
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

async function serverSet(sageMessage: SageMessage<true>): Promise<void> {
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

	// TODO: consider allowing updating games by messaging bot directly

	const gameType = sageMessage.args.removeAndReturnGameType();
	const critMethodType = sageMessage.args.removeAndReturnCritMethodType();
	const dialogType = sageMessage.args.removeAndReturnDialogType();
	const diceOutputType = sageMessage.args.removeAndReturnDiceOutputType();
	const dicePostType = sageMessage.args.removeAndReturnDicePostType();
	const diceSecretMethodType = sageMessage.args.removeAndReturnDiceSecretMethodType();

	if (gameType === undefined && dialogType === undefined && critMethodType === undefined && diceOutputType === undefined && dicePostType === undefined && diceSecretMethodType === undefined) {
		return sageMessage.reactFailure();
	}

	const updated = await sageMessage.server.update(gameType, dialogType, critMethodType, diceOutputType, dicePostType, diceSecretMethodType);
	return sageMessage.reactSuccessOrFailure(updated);
}

export default function register(): void {
	registerAdminCommand(serverCount, "server-count");
	registerAdminCommand(serverList, "server-list");
	registerAdminCommand(serverInit, "server-init");
	registerAdminCommand(serverDetails, "server-details");
	registerAdminCommand(serverSet, "server-set");

	registerAdminCommandHelp("Admin", "SuperUser", "Server", "server count");
	registerAdminCommandHelp("Admin", "SuperUser", "Server", "server list");
	registerAdminCommandHelp("Admin", "SuperUser", "Server", "server list {optionalFilter}");
	registerAdminCommandHelp("Admin", "SuperUser", "Server", "server details");
	registerAdminCommandHelp("Admin", "SuperUser", "Server", "server set game=PF2E|NONE diceoutput=XXS|XS|S|M|L|XL|UNSET dicepost=POST|EMBED|UNSET crit=TIMESTWO|ROLLTWICE");
}
