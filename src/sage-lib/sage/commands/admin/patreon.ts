import { toHumanReadable } from "../../../../sage-utils/utils/DiscordUtils/humanReadable";
import { send } from "../../../discord/messages";
import type SageCache from "../../model/SageCache";
import type SageMessage from "../../model/SageMessage";
import Server from "../../model/Server";
import User, { PatronTierSnowflakes, PatronTierType } from "../../model/User";
import { createAdminRenderableContent, registerAdminCommand } from "../cmd";


async function patreonSync(sageMessage: SageMessage): Promise<void> {
	const isHome = Server.isHome(sageMessage.server?.did),
		isDm = sageMessage.message.channel.type === "DM";
	if (!sageMessage.isSuperUser || !(isHome || isDm)) {
		return sageMessage.reactBlock();
	}
	return syncPatreon(sageMessage.caches);
}

export async function syncPatreon(sageCache: SageCache): Promise<void> {
	const renderableContent = createAdminRenderableContent(sageCache.bot, `<b>Patrons</b>`);

	const guildRoles = await Promise.all(PatronTierSnowflakes.map(roleDid => roleDid ? sageCache.discord.fetchGuildRole(roleDid) : null));
	const guildRoleMembers = guildRoles.map((guildRole, tier) => guildRole && tier ? Array.from(guildRole.members.values()) : []);

	console.log(`Removing ex-Patreon Users`);
	const sageUsers = await sageCache.users.getAll();
	for (const sageUser of sageUsers) {
		const tier = guildRoleMembers.findIndex((members, _tier) => _tier ? members?.find(member => member.id === sageUser.did) : undefined);
		if (sageUser.isPatron && tier <= PatronTierType.None) {
			sageUser.patronTier = PatronTierType.None;
			const saved = await sageUser.save();
			renderableContent.append(`Removing ex-Patron ${sageUser.did} ... ${saved}`);
		}
	}

	console.log(`Syncing Patreon Users`);
	for (let tier = 1; tier < guildRoleMembers.length; tier++) {
		for (const member of guildRoleMembers[tier]) {
			let sageUser = sageUsers.find(user => user.did === member.id);
			if (sageUser) {
				if (sageUser.patronTier !== tier) {
					const oldTier = sageUser.patronTier;
					sageUser.patronTier = tier;
					const saved = await sageUser.save();
					renderableContent.append(`Updating Patron ${sageUser.did} from ${PatronTierType[oldTier || 0]} to ${PatronTierType[tier]} ... ${saved}`);
				}
			} else {
				sageUser = new User(User.createCore(member.id), sageCache);
				sageUser.patronTier = tier;
				const saved = await sageUser.save();
				renderableContent.append(`Adding Patron ${sageUser.did} to ${PatronTierType[tier]} ... ${saved}`);
			}
		}
	}

	guildRoleMembers.forEach((members, tier) => {
		if (tier) {
			renderableContent.appendTitledSection(`${PatronTierType[tier]} (${members.length})`, members.map(member => toHumanReadable(member.user)).join(", "));
		}
	});

	const superUser = (await sageCache.discord.fetchUser(User.SuperUserDid))!;
	const dmChannel = superUser.dmChannel ?? await superUser.createDM();
	send(sageCache, dmChannel, renderableContent, superUser);
}

export default function register(): void {
	registerAdminCommand(patreonSync, "patreon-sync");
}
