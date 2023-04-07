import { ActionRowBuilder, ButtonInteraction, ChatInputCommandInteraction, ComponentType, ModalBuilder, Snowflake, TextInputBuilder, TextInputStyle } from "discord.js";
import { DiscordMaxValues } from "../../../../../sage-utils/DiscordUtils";
import { isNonNilSnowflake } from "../../../../../sage-utils/SnowflakeUtils";
import { isNil as isNilUuid, isValid as isValidUuid } from "../../../../../sage-utils/UuidUtils";
import { NIL_UUID, UUID } from "../../../../../sage-utils/UuidUtils/types";
import { registerSlashCommand } from "../../../../../slash.mjs";
import { TSlashCommand } from "../../../../../types";
import { registerInteractionListener } from "../../../../discord/handlers";
import { GameCharacter } from "../../../model/GameCharacter";
import { SageInteraction } from "../../../model/SageInteraction";
import { User } from "../../../model/User";


//#region customId

type CharModalIndicator = "CharModal";
type CharModalCharType = "pc" | "npc" | "gm" | "gpc" | "gnpc";
type CharModalAction = "Submit";
type CustomIdParts = {
	/** indicator that this control belongs to this form */
	indicator: CharModalIndicator;

	/** User DID */
	userDid: Snowflake;

	/** Character UUID */
	charId: UUID;

	/** What type of character is this? */
	charType: CharModalCharType;

	/** Action */
	action: CharModalAction;
};

function createCustomId(userDid: Snowflake, charId: UUID, charType: CharModalCharType): string {
	return `CharModal|${userDid}|${charId}|${charType}|Submit`;
}
function isValidIndicator(indicator: string): indicator is CharModalIndicator {
	return indicator === "CharModal";
}
function isValidCharType(charType: string): charType is CharModalCharType {
	return ["pc", "npc", "gm", "gpc", "gnpc"].includes(charType);
}
function isValidAction(action: string): action is CharModalAction {
	return action === "Submit";
}
function parseCustomId(customId: string): CustomIdParts | null {
	const [indicator, userDid, charId, charType, action] = customId.split("|");
	if (isValidIndicator(indicator) && isNonNilSnowflake(userDid) && isValidUuid(charId) && isValidCharType(charType) && isValidAction(action)) {
		return { indicator, userDid, charId, charType, action };
	}
	return null;
}

//#endregion

//#region Modal Submit

function charModalSubmitTester(sageInteraction: SageInteraction): CustomIdParts | null {
	return sageInteraction.parseCustomId(parseCustomId);
}
async function charModalSubmitHandler(sageInteraction: SageInteraction, idParts: CustomIdParts): Promise<void> {
	if (idParts.userDid !== sageInteraction.actor.did) {
		// ask them what they are trying to do? tell them to piss off!
		return sageInteraction.whisper("Please don't touch another user's characters!");
	}
	const form = sageInteraction.getModalForm<CharForm>();
	if (form) {
		if (["pc","npc"].includes(idParts.charType)) {
			if (isNilUuid(idParts.charId)) {
				// new char
			}else {
				// old char
				const charCore = await User.fetchCharacter(idParts.userDid, idParts.charId);
				if (charCore) {
					const char = new GameCharacter(charCore);
					char.name = form.charName;
					char.images.setUrl(form.charAvatarUrl, "avatar");
					char.images.setUrl(form.charDialogUrl, "dialog");
					char.images.setUrl(form.charTokenUrl, "token");
					char.embedColor = form.charEmbedColor;
				}else {
					return sageInteraction.whisper("Where did your character go? (should not see this)");
				}
			}
		}
		console.log({idParts,form});
		return sageInteraction.whisper("Success!");
	}
	return sageInteraction.whisper("How did we get here? (should not see this)");
}

//#endregion

type CharForm = {
	charName: string;
	charAvatarUrl: string;
	charDialogUrl: string | undefined;
	charTokenUrl: string | undefined;
	charEmbedColor: string | undefined;
};

function getMaxLength(fieldId: string): number | undefined {
	switch(fieldId) {
		case "charEmbedColor": return 10;
		case "charName": return DiscordMaxValues.usernameLength;
		default: return undefined;
	}
}
function createInput(custom_id: keyof CharForm, label: string, required: boolean, value?: string, placeholder?: string): ActionRowBuilder<TextInputBuilder> {
	const style = TextInputStyle.Short;
	const type = ComponentType.TextInput;
	const max_length = getMaxLength(custom_id);
	const input = TextInputBuilder.from({ custom_id, label, required, style, value, type, placeholder, max_length });
	return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
}

export async function sendCharModal(sageInteraction: SageInteraction<ChatInputCommandInteraction | ButtonInteraction>, character?: GameCharacter, charType: CharModalCharType = "pc"): Promise<void> {
	if (!character) {
		character = new GameCharacter({ id:NIL_UUID, name:"New Character" });
	}

	const nameRow = createInput(`charName`, "Character Name", true, character.name);
	const avatarRow = createInput(`charAvatarUrl`, "Avatar Image Url", true, character.images.getUrl("avatar"));
	const dialogRow = createInput(`charDialogUrl`, "Dialog Image Url", false, character.images.getUrl("dialog"));
	const tokenRow = createInput(`charTokenUrl`, "Token Image Url", false, character.images.getUrl("token"));
	const colorRow = createInput(`charEmbedColor`, "Dialog Embed Color", false, character.embedColor, "Hex value, format: #00AAFF");

	const modal = new ModalBuilder()
		.setCustomId(createCustomId(sageInteraction.actor.did, character.id, charType))
		.setTitle("Character Form")
		.addComponents(nameRow, avatarRow, dialogRow, tokenRow, colorRow)
		;

	await sageInteraction.interaction.showModal(modal);
}

//#region Slash Command

function isCharModalInteraction(sageInteraction: SageInteraction<ChatInputCommandInteraction>): boolean {
	return sageInteraction.isCommand("Character");
}

//#region registerSlashCommand

function characterCommand(): TSlashCommand {
	return  {
		name: "Character",
		description: "Manage one of your characters.",
		options: [
			{ name:"charType", description:"Which type of character?", choices:["PC", "NPC"] }
		]
	};
}

export function registerSlashCommands(): void {
	registerSlashCommand(characterCommand());
}

//#endregion

//#endregion

export function registerCommandHandlers(): void {
	registerInteractionListener(charModalSubmitTester, charModalSubmitHandler);
	registerInteractionListener(isCharModalInteraction, sendCharModal);
}
