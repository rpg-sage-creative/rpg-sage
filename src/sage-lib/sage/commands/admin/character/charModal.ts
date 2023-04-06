import { ActionRowBuilder, ButtonInteraction, ChatInputCommandInteraction, ComponentType, ModalBuilder, Snowflake, TextInputBuilder, TextInputStyle } from "discord.js";
import { UUID } from "../../../../../sage-utils/UuidUtils/types";
import { registerSlashCommand } from "../../../../../slash.mjs";
import { TSlashCommand } from "../../../../../types";
import { registerInteractionListener } from "../../../../discord/handlers";
import { SageInteraction } from "../../../model/SageInteraction";
import { GameCharacter } from "../../../model/GameCharacter";


//#region customId

type CharModalIndicator = "CharModal";
type CharModalAction = "Submit";
type CustomIdParts = {
	/** indicator that this control belongs to this form */
	indicator: CharModalIndicator;

	/** User DID */
	userDid: Snowflake;

	/** Character UUID */
	charId: UUID;

	/** Action */
	action: CharModalAction;
};

function createCustomId(userDid: Snowflake, charId: UUID): string {
	return `CharModal|${userDid}|${charId}|Submit`;
}

function parseCustomId(customId: string): CustomIdParts | null {
	const match = customId.match(/(CharModal)\|(\d{16,})\|([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\|(Submit)/);
	if (match) {
		return {
			indicator: match[1] as CharModalIndicator,
			userDid: match[2],
			charId: match[3],
			action: match[4] as CharModalAction
		};
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
	console.log({idParts,form});
	return sageInteraction.whisper("Success!");
}

//#endregion

type CharForm = { charName:string; }

function createInput(custom_id: string, label: string, required: boolean, value = "", placeholder = ""): ActionRowBuilder<TextInputBuilder> {
	const style = TextInputStyle.Short;
	const type = ComponentType.TextInput;
	const input = TextInputBuilder.from({ custom_id, label, required, style, value, type, placeholder });
	return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
}

export async function sendCharModal(sageInteraction: SageInteraction<ChatInputCommandInteraction | ButtonInteraction>, character: GameCharacter): Promise<void> {
	character.name;
	character.images.getUrl("dialog");
	character.images.getUrl("avatar");
	character.images.getUrl("token");
	character.embedColor
	const nameRow = createInput(`charName`, "Character Name", true, character.name);
	const avatarRow = createInput(`charAvatarUrl`, "Avatar Image Url", true, character.images.getUrl("avatar"));
	const dialogRow = createInput(`charDialogUrl`, "Dialog Image Url", true, character.images.getUrl("dialog"));
	const colorRow = createInput(`charEmbedColor`, "Dialog Embed Color", true, character.embedColor, "Hex value, format: #00AAFF");

	const modal = new ModalBuilder()
		.setCustomId(createCustomId(sageInteraction.actor.did, ""))
		.setTitle("Character Form")
		.addComponents(nameRow, avatarRow, dialogRow, colorRow)
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
