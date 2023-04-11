import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ModalBuilder, Snowflake } from "discord.js";
import { DInteraction, DiscordMaxValues, addShortText } from "../../../../../sage-utils/DiscordUtils";
import { isNonNilSnowflake } from "../../../../../sage-utils/SnowflakeUtils";
import { isNil as isNilUuid, isValid as isValidUuid } from "../../../../../sage-utils/UuidUtils";
import { NIL_UUID, UUID } from "../../../../../sage-utils/UuidUtils/types";
import { registerSlashCommand } from "../../../../../slash.mjs";
import { TSlashCommand } from "../../../../../types";
import { registerInteractionListener } from "../../../../discord/handlers";
import { GameCharacter, GameCharacterCore } from "../../../model/GameCharacter";
import { SageInteraction } from "../../../model/SageInteraction";
import { User } from "../../../model/User";
import { sendGameCharacter } from "./sendGameCharacter";


//#region customId

type CharModalIndicator = "CharModal";

/** What type of character is this? */
type CharModalCharType =
	/** user pc */
	"pc"
	/** user npc */
	| "npc"
	/** game's gm */
	| "gm"
	/** game pc */
	| "gpc"
	/** game npc */
	| "gnpc";

type CharModalAction = "Submit" | "Confirm" | "Cancel";

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

function createCustomId(userDid: Snowflake, charId: UUID, charType: CharModalCharType, action: CharModalAction): string {
	return `CharModal|${userDid}|${charId}|${charType}|${action}`;
}
function isValidIndicator(indicator: string): indicator is CharModalIndicator {
	return indicator === "CharModal";
}
function isValidCharType(charType: string): charType is CharModalCharType {
	return ["pc", "npc", "gm", "gpc", "gnpc"].includes(charType);
}
function isValidAction(action: string): action is CharModalAction {
	return ["Submit", "Confirm", "Cancel"].includes(action);
}
function parseCustomId(customId: string): CustomIdParts | null {
	const [indicator, userDid, charId, charType, action] = customId.split("|");
	if (isValidIndicator(indicator) && isNonNilSnowflake(userDid) && isValidUuid(charId) && isValidCharType(charType) && isValidAction(action)) {
		return { indicator, userDid, charId, charType, action };
	}
	return null;
}

//#endregion

//#region confirmation post

//#endregion

//#region Modal Submit

function charModalSubmitTester(sageInteraction: SageInteraction): CustomIdParts | null {
	const idParts = sageInteraction.parseCustomId(parseCustomId);
	return idParts?.action === "Submit" ? idParts : null;
}
function charModalConfirmTester(sageInteraction: SageInteraction): CustomIdParts | null {
	const idParts = sageInteraction.parseCustomId(parseCustomId);
	return idParts?.action === "Confirm" ? idParts : null;
}
function charModalCancelTester(sageInteraction: SageInteraction): CustomIdParts | null {
	const idParts = sageInteraction.parseCustomId(parseCustomId);
	return idParts?.action === "Cancel" ? idParts : null;
}
function createNewCharCore(): GameCharacterCore {
	return {
		id: NIL_UUID,
		name: "New Character",
		images: [],
		embedColor: undefined,
		userDid: undefined
	};
}
async function saveTmpChar(idParts: CustomIdParts, form: CharForm): Promise<GameCharacter | null> {
	// create core
	const charCore = isNilUuid(idParts.charId)
		? createNewCharCore()
		: await User.fetchCharacter(idParts.userDid, idParts.charId);

	// make sure we didn't fail somehow
	if (!charCore) {
		console.error(`Unable to save temp character!`, idParts, form);
		return null;
	}

	// create character to set all values from form
	const char = new GameCharacter(charCore);
	char.name = form.charName;
	char.images.setUrl(form.charAvatarUrl, "avatar");
	char.images.setUrl(form.charDialogUrl, "dialog");
	char.images.setUrl(form.charTokenUrl, "token");
	char.embedColor = form.charEmbedColor;

	/** @todo validate that the urls are images */

	// write tmp core
	const saved = await User.writeTempCharacter(idParts.userDid, charCore);
	return saved ? char : null;
}
function buttons(): ActionRowBuilder<ButtonBuilder> {
	const yes = new ButtonBuilder();
	yes.setCustomId("yes-button").setLabel("Yes").setStyle(ButtonStyle.Success);
	const no = new ButtonBuilder();
	no.setCustomId("no-button").setLabel("No").setStyle(ButtonStyle.Secondary);
	const row = new ActionRowBuilder<ButtonBuilder>();
	row.addComponents(no, yes);
	return row;
}
async function charModalSubmitHandler(sageInteraction: SageInteraction<DInteraction>, idParts: CustomIdParts): Promise<void> {
	if (idParts.userDid !== sageInteraction.actor.did) {
		// ask them what they are trying to do? tell them to piss off!
		return sageInteraction.whisper("Please don't touch another user's characters!");
	}
	const form = sageInteraction.getModalForm<CharForm>();
	if (form) {
		console.log({idParts,form});
		if (["pc","npc"].includes(idParts.charType)) {
			// try to save the core so we can wait for the user to act on it
			const tmpChar = await saveTmpChar(idParts, form);
			if (!tmpChar) {
				return sageInteraction.whisper("An unexpected error occurred! We are unable to edit this character at this time.");
			}
			// prompt for save
			await sendGameCharacter(sageInteraction, tmpChar);
			// handle save confirm by updating/adding actual character, then ...
			await sageInteraction.interaction.channel?.send({
				content:"Does this look right?",
				components: [buttons()]
			});
			// handle save confirm/deny by deleting temp core
			return sageInteraction.whisper("Success!");
		}
		return sageInteraction.whisper("We aren't doing this yet!");
	}
	return sageInteraction.whisper("How did we get here? (should not see this)");
}
async function charModalConfirmHandler(sageInteraction: SageInteraction<DInteraction>, idParts: CustomIdParts): Promise<void> {
	const charCore = await User.fetchCharacter(idParts.userDid, idParts.charId, true);
	if (charCore) {
		const chars = await sageInteraction.actor.s.fetchPlayerCharacters();
		const saved = await chars.addCharacter(charCore);
		if (saved) {
			return sageInteraction.whisper("Success!");
		}else {
			console.error(`Error adding character.`);
		}
	}else {
		console.error(`Error reading tmp core.`);
	}
	await User.deleteTempCharacter(idParts.userDid, idParts.charId);
	return sageInteraction.whisper("Failure!");
}
async function charModalCancelHandler(sageInteraction: SageInteraction<DInteraction>, idParts: CustomIdParts): Promise<void> {
	await User.deleteTempCharacter(idParts.userDid, idParts.charId);
	return sageInteraction.whisper("Nevermind!");
}

//#endregion

type CharForm = {
	charName: string;
	charAvatarUrl: string;
	charDialogUrl: string | undefined;
	charTokenUrl: string | undefined;
	charEmbedColor: string | undefined;
};

function createModal(userDid: Snowflake, character: GameCharacter, charType: CharModalCharType): ModalBuilder {
	const isNew = character.id === NIL_UUID;
	const modal = new ModalBuilder();
	modal.setTitle(isNew ? "Create Character" : "Edit Character");
	modal.setCustomId(createCustomId(userDid, character.id, charType, "Submit"));
	addShortText(modal, true).setCustomId("charName").setLabel("Character Name").setValue(character.name).setMaxLength(DiscordMaxValues.usernameLength);
	addShortText(modal, true).setCustomId("charAvatarUrl").setLabel("Avatar Image Url").setValue(character.images.getUrl("avatar") ?? "");
	addShortText(modal).setCustomId("charDialogUrl").setLabel("Dialog Image Url").setValue(character.images.getUrl("dialog") ?? "");
	addShortText(modal).setCustomId("charTokenUrl").setLabel("Token Image Url").setValue(character.images.getUrl("token") ?? "");
	addShortText(modal).setCustomId("charEmbedColor").setLabel("Dialog Embed Color").setValue(character.embedColor ?? "").setPlaceholder("Hex value, format: #00AAFF").setMaxLength(10);
	return modal;
}

export async function sendCharModal(sageInteraction: SageInteraction<ChatInputCommandInteraction | ButtonInteraction>, character?: GameCharacter, charType: CharModalCharType = "pc"): Promise<void> {
	if (!character) {
		character = new GameCharacter({ id:NIL_UUID, name:"New Character" });
	}
	const modal = createModal(sageInteraction.actor.did, character, charType);
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
	registerInteractionListener(charModalConfirmTester, charModalConfirmHandler);
	registerInteractionListener(charModalCancelTester, charModalCancelHandler);
	registerInteractionListener(isCharModalInteraction, sendCharModal);
}
