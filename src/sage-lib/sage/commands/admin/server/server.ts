import type { Role } from "discord.js";
import { GameType } from "../../../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../../sage-dice";
import type { Optional } from "../../../../../sage-utils";
import { Collection } from "../../../../../sage-utils/ArrayUtils";
import { isNonNilSnowflake } from "../../../../../sage-utils/SnowflakeUtils";
import type { RenderableContent } from "../../../../../sage-utils/RenderUtils";
import { isValid } from "../../../../../sage-utils/UuidUtils";
import type { SageMessage } from "../../../model/SageMessage";
import type { Server } from "../../../model/Server";
import { AdminRoleType, getServerDefaultGameOptions, IAdminRole } from "../../../model/Server";
import { DialogType } from "../../../repo/base/channel";
import { createAdminRenderableContent, registerAdminCommand, renderCount } from "../../cmd";
import { DicePostType } from "../../dice";
import { registerAdminCommandHelp } from "../../help";

async function serverCount(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.isSuperUser) {
		const servers = await sageMessage.sageCache.servers.getAll();
		const active = servers.filter(server => server.isActive);
		return renderCount(sageMessage, "Servers", servers.length, active.length);
	}
}

async function serverList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) return;

	let servers = await sageMessage.sageCache.servers.getAll();
	if (servers) {
		const filter = sageMessage.args.unkeyedValues().join(" ");
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
		return;
	}

	const denial = sageMessage.checkDenyAdminServer("Initialize Server");
	if (denial) {
		return denial;
	}

	const saved = await sageMessage.sageCache.servers.initializeServer(sageMessage.message.guild);
	return sageMessage.reactSuccessOrFailure(saved, "Server Initialized", "Unknown Error; Server NOT Initialized!");
}

function serverDetailsDefaultTypes(renderableContent: RenderableContent, server: Server): void {
	renderableContent.append(`<b>Default Dialog Type</b> ${DialogType[server.defaultDialogType!] ?? "<i>unset (Embed)</i>"}`);
	renderableContent.append(`<b>Default Game Type</b> ${GameType[server.defaultGameType!] ?? "<i>unset (None)</i>"}`);
	if (server.defaultGameType === GameType.PF2e) {
		renderableContent.append(`<b>Default Crit Method Type</b> ${CritMethodType[server.defaultCritMethodType!] ?? "<i>unset (x2)</i>"}`);
	}
	renderableContent.append(`<b>Default Dice Output Type</b> ${DiceOutputType[server.defaultDiceOutputType!] ?? "<i>unset (M)</i>"}`);
	renderableContent.append(`<b>Default Dice Post Type</b> ${DicePostType[server.defaultDicePostType!] ?? "<i>unset (Post)</i>"}`);
	renderableContent.append(`<b>Default Dice Secret Method Type</b> ${DiceSecretMethodType[server.defaultDiceSecretMethodType!] ?? "<i>unset (Ignore)</i>"}`);
}

type TRole = { role:IAdminRole, discordRole:Role };
async function serverDetails(sageMessage: SageMessage): Promise<void> {
	let server: Optional<Server> = sageMessage.server;
	// if (server && !sageMessage.checkCanAdminServer()) {
	// 	return sageMessage.denyForCanAdminServer("Server Details");
	// }
	if (!server && sageMessage.isSuperUser) {
		const idOrDid = sageMessage.args.getString("server");
		if (isValid(idOrDid)) {
			server = await sageMessage.sageCache.servers.getById(idOrDid);
		}
		if (isNonNilSnowflake(idOrDid)) {
			server = await sageMessage.sageCache.servers.getByDid(idOrDid);
		}
	}
	if (!server) {
		return sageMessage.reactFailure("Server Not Found!");
	}

	const roles = <TRole[]>await Collection.mapAsync(server.roles, async role => {
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
			renderableContent.append(`<b>Sage Admin Roles</b> ${!roles.length ? "<i>none set</i>" : roles.map(role => `@${role.discordRole.name} (${AdminRoleType[role.role.type]})`).join(", ")}`);
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
	const denial = sageMessage.checkDenyAdminServer("Set Server Options");
	if (denial) {
		return denial;
	}

	const options = getServerDefaultGameOptions(sageMessage.args);
	if (options === null) {
		return sageMessage.reactWarn("No Options given!");
	}

	const updated = await sageMessage.server.update(options);
	return sageMessage.reactSuccessOrFailure(updated, "Server Updated", "Unknown Error; Server NOT Updated!");
}

export function register(): void {
	registerAdminCommand(serverCount, "server-count");
	registerAdminCommand(serverList, "server-list");
	registerAdminCommand(serverInit, "server-init");
	registerAdminCommand(serverDetails, "server-details");
	registerAdminCommand(serverSet, "server-update", "server-set");

	registerAdminCommandHelp("Admin", "Server", "server details");
	registerAdminCommandHelp("Admin", "Server", "server set game=PF2E|NONE diceoutput=XXS|XS|S|M|L|XL|UNSET dicepost=POST|EMBED|UNSET crit=TIMESTWO|ROLLTWICE");
}
