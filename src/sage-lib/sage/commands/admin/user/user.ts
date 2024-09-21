import { DialogPostType } from "@rsc-sage/types";
import { toHumanReadable } from "@rsc-utils/discord-utils";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { DialogDiceBehaviorType } from "../../../model/User.js";
import { createAdminRenderableContent } from "../../cmd.js";

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

	const { validKeys, hasValidKeys, hasInvalidKeys } = sageMessage.args.validateKeys(["dialogDiceBehavior", "dialogPostType", "dmOnDelete", "dmOnEdit", "sagePostType", "orgPlayId"]);
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

	if (validKeys.includes("dialogDiceBehavior") || validKeys.includes("dialogPostType") || validKeys.includes("sagePostType") || validKeys.includes("dmOnDelete") || validKeys.includes("dmOnEdit")) {
		const dialogDiceBehaviorType = sageMessage.args.getEnum(DialogDiceBehaviorType, "dialogDiceBehavior");
		const dialogPostType = sageMessage.args.getEnum(DialogPostType, "dialogPostType");
		const sagePostType = sageMessage.args.getEnum(DialogPostType, "sagePostType");
		const dmOnDelete = sageMessage.args.getBoolean("dmOnDelete");
		const dmOnEdit = sageMessage.args.getBoolean("dmOnEdit");
		ptUpdated = await sageMessage.sageUser.update({ dialogDiceBehaviorType, dialogPostType, dmOnDelete, dmOnEdit, sagePostType });
	}

	if (opUpdated || ptUpdated) {
		return userDetails(sageMessage);
	}

	return sageMessage.reply("Sorry, we were unable to save your changes.", true);
}

async function userDetails(sageMessage: SageCommand): Promise<void> {
	const { sageUser } = sageMessage;

	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>User Details</b>`);

	const discordUser = await sageMessage.discord.fetchUser(sageUser.did);
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
		renderableContent.append(`<b>Discord Id</b> ${sageUser.did || "<i>NOT SET</i>"}`);
		renderableContent.append(`<b>Status</b> ${"<i>NOT FOUND</i>"}`);
	}

	renderableContent.append();
	renderableContent.append(`<b>RPG Sage Id</b> ${sageUser.id}`);

	const dialogDiceBehaviorType = DialogDiceBehaviorType[sageUser.dialogDiceBehaviorType!] ?? `<i>unset (Normal)</i>`;
	renderableContent.append(`<b>Preferred Dialog Dice Behavior</b> ${dialogDiceBehaviorType}`);

	const dialogPostType = DialogPostType[sageUser.dialogPostType!] ?? `<i>unset (Embed)</i>`;
	renderableContent.append(`<b>Preferred Dialog Type</b> ${dialogPostType}`);

	const sagePostType = DialogPostType[sageUser.sagePostType!] ?? `<i>unset (Embed)</i>`;
	renderableContent.append(`<b>Preferred Sage Post Type</b> ${sagePostType}`);

	const orgPlayId = sageUser.notes.getUncategorizedNote("orgPlayId")?.note ?? `<i>unset</i>`;
	renderableContent.append(`<b>Paizo Organized Play #</b> ${orgPlayId}`);

	const dmOnDelete = sageUser.dmOnDelete === true ? `Yes` : `No`;
	renderableContent.append(`<b>Receive DMs on Dialog Delete</b> ${dmOnDelete}`);

	const dmOnEdit = sageUser.dmOnEdit === true ? `Yes` : `No`;
	renderableContent.append(`<b>Receive DMs on Dialog Edit</b> ${dmOnEdit}`);

	// TODO: List any games, gameRoles, servers, serverRoles!

	await sageMessage.reply(renderableContent, true);
}

export function registerUser(): void {
	registerListeners({ commands:["user|set", "user|update"], message:userUpdate });
	registerListeners({ commands:["user|details", "User Details"], interaction:userDetails, message:userDetails });
}
