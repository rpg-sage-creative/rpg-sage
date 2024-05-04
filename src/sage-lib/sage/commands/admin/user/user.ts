import { DialogPostType } from "@rsc-sage/types";
import { toHumanReadable } from "@rsc-utils/discord-utils";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { User as SUser } from "../../../model/User.js";
import { createAdminRenderableContent } from "../../cmd.js";
import { renderCount } from "../../helpers/renderCount.js";

async function userCount(sageCommand: SageCommand): Promise<void> {
	if (sageCommand.isSuperUser) {
		const users = await sageCommand.sageCache.users.getAll();
		return renderCount(sageCommand, "Users", users.length);
	}
}

/**
 * @todo include other organized play ids:
 * "Cypher Play" (Monte Cook Games)
 * https://dnd.wizards.com/adventurers-league
 * https://www.chaosium.com/organized-play/
 * https://www.facebook.com/groups/2757897967823921 (Frog God Games: https://discord.gg/dzpXfGG)
 * https://stargatetherpg.com/files/file/44-stargate-phoenix-series-guide/
 * https://www.shadowruntabletop.com/missions/
 * https://fasagames.com/earthdawn-whatis/legendsofbarsaive/
 * L5R has a fan run Org Play campaign, Heroes of Rokugan
 * Kobold Press had something for their Midgard Campiagn it will probably carry over to Tales of the Valiant
 * Evil Genius Games with Everyday Heroes: EGO (https://evilgeniusgames.com/the-organized-play/)
 */

async function userUpdate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowCommand) {
		return sageMessage.denyByProv("User Update", "You cannot manage your settings here.");
	}

	const { validKeys, hasValidKeys, hasInvalidKeys } = sageMessage.args.validateKeys(["dialogPostType", "sagePostType", "orgPlayId"]);
	if (!hasValidKeys || hasInvalidKeys) {
		const details = [
			"The command for updating your User settings is:",
			"> ```sage!user update dialogPostType=\"\" sagePostType=\"\" orgPlayId=\"\"```",
			"Acceptable PostType values are:",
			"> `embed`, `post`, or `unset`",
			"For example:",
			"> ```sage!user update dialogPostType=\"embed\" sagePostType=\"post\"```",
			"> ```sage!user update orgPlayId=\"999999\"```",
			"> ```sage!user update dialogPostType=\"unset\" orgPlayId=\"unset\"```",
		];
		return sageMessage.whisper(details.join("\n"));
	}

	let opUpdated = false;
	let ptUpdated = false;

	if (validKeys.includes("orgPlayId")) {
		const orgPlayId = sageMessage.args.getString("orgPlayId");
		if (orgPlayId) {
			opUpdated = await sageMessage.sageUser.notes.setUncategorizedNote("orgPlayId", orgPlayId);
		}else {
			opUpdated = await sageMessage.sageUser.notes.unsetUncategorizedNote("orgPlayId");
		}
	}

	if (validKeys.includes("dialogPostType") || validKeys.includes("sagePostType")) {
		const dialogPostType = sageMessage.args.getEnum(DialogPostType, "dialogPostType");
		const sagePostType = sageMessage.args.getEnum(DialogPostType, "sagePostType");
		ptUpdated = await sageMessage.sageUser.update({ dialogPostType, sagePostType });
	}

	if (opUpdated || ptUpdated) {
		return userDetails(sageMessage);
	}

	return sageMessage.reply("Sorry, we were unable to save your changes.", true);
}

async function userDetails(sageMessage: SageCommand): Promise<void> {
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

	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>User Details</b>`);
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

		renderableContent.append();
		renderableContent.append(`<b>RPG Sage Id</b> ${user.id}`);

		const dialogPostType = DialogPostType[user.dialogPostType!] ?? `<i>unset (Embed)</i>`;
		renderableContent.append(`<b>Preferred Dialog Type</b> ${dialogPostType}`);

		const sagePostType = DialogPostType[user.sagePostType!] ?? `<i>unset (Embed)</i>`;
		renderableContent.append(`<b>Preferred Sage Post Type</b> ${sagePostType}`);

		const orgPlayId = sageMessage.sageUser.notes.getUncategorizedNote("orgPlayId")?.note ?? `<i>unset</i>`;
		renderableContent.append(`<b>Paizo Organized Play #</b> ${orgPlayId}`);

		// TODO: List any games, gameRoles, servers, serverRoles!
	} else {
		renderableContent.append(`<blockquote>User Not Found!</blockquote>`);
	}

	await sageMessage.reply(renderableContent, true);
}

export function registerUser(): void {
	registerListeners({ commands:["user|count"], message:userCount });
	registerListeners({ commands:["user|set", "user|update"], message:userUpdate });
	registerListeners({ commands:["user|details", "User Details"], interaction:userDetails, message:userDetails });
}
