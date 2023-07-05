import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ModalBuilder, ModalSubmitInteraction, Snowflake, StringSelectMenuBuilder, userMention } from "discord.js";
import { NIL_UUID, UUID, isUuid } from "../../../sage-utils/UuidUtils";
import { isNonNilSnowflake } from "../../../sage-utils/SnowflakeUtils";
import { SageInteraction } from "../model/SageInteraction";
import { DChannel, DInteraction, DiscordMaxValues, addParagraph, addShortText } from "../../../sage-utils/DiscordUtils";
import { registerInteractionListener, registerMessageListener } from "../../discord/handlers";
import { SageCommand } from "../model/SageCommand";
import { TDialogContent } from "./dialog";
import { SageMessage } from "../model/SageMessage";
import { TCommandAndArgs } from "../../discord";

type DialogForm = {
	dialogWho: string;
	dialogTitle: string;
	dialogImage: string;
	dialogColor: string;
	dialogContent: string;
};

//#region customId

type DialogModalIndicator = "DialogModal";

/** What type of character is this? */
type DialogModalCharType =
	/** pc */
	"pc"
	/** npc */
	| "npc"
	/** gm */
	| "gm"
	| "enemy"
	| "ally";

type DialogModalAction = "Submit" | "Confirm" | "Cancel" | "Yes" | "No";

type CustomIdParts = {
	/** indicator that this control belongs to this form */
	indicator: DialogModalIndicator;

	/** User DID */
	userDid: Snowflake;

	/** Character UUID */
	charId: UUID;

	/** What type of character is this? */
	charType: DialogModalCharType;

	/** Action */
	action: DialogModalAction;
};

function createCustomId(idParts: CustomIdParts): string;
function createCustomId(idParts: CustomIdParts, action: DialogModalAction): string;
function createCustomId(userDid: Snowflake, charId: UUID, charType: DialogModalCharType, action: DialogModalAction): string;
function createCustomId(idPartsOrUserDid: CustomIdParts | Snowflake, charIdOrAction?: UUID | DialogModalAction, charType?: DialogModalCharType, action?: DialogModalAction): string {
	if (typeof(idPartsOrUserDid) === "string") {
		return `DialogModal|${idPartsOrUserDid}|${charIdOrAction}|${charType}|${action}`;
	}
	return `DialogModal|${idPartsOrUserDid.userDid}|${idPartsOrUserDid.charId}|${idPartsOrUserDid.charType}|${charIdOrAction ?? idPartsOrUserDid.action}`;
}
function isValidIndicator(indicator: string): indicator is DialogModalIndicator {
	return indicator === "DialogModal";
}
function isValidCharType(charType: string): charType is DialogModalCharType {
	return ["pc", "npc", "gm", "enemy", "ally"].includes(charType);
}
function isValidAction(action: string): action is DialogModalAction {
	return ["Submit", "Confirm", "Cancel", "Yes", "No"].includes(action);
}
function parseCustomId(customId: string): CustomIdParts | null {
	const [indicator, userDid, charId, charType, action] = customId.split("|");
	if (isValidIndicator(indicator) && isNonNilSnowflake(userDid) && isUuid(charId) && isValidCharType(charType) && isValidAction(action)) {
		return { indicator, userDid, charId, charType, action };
	}
	return null;
}

//#endregion

//#region modal submit tester / handler

function dialogModalTester(sageInteraction: SageInteraction): CustomIdParts | null {
	return sageInteraction.parseCustomId(parseCustomId);
}
type SageButtonInteraction = SageInteraction<ButtonInteraction>;
type SageModalInteraction = SageInteraction<ModalSubmitInteraction>;
async function dialogModalHandler(sageInteraction: SageInteraction<DInteraction>, idParts: CustomIdParts): Promise<void> {
	if (idParts.userDid !== sageInteraction.actor.did) {
		return sageInteraction.whisper("Please don't touch another user's buttons!");
	}
	switch(idParts.action) {
		// case "Cancel": return dialogModalCancelHandler(sageInteraction as SageButtonInteraction, idParts);
		// case "Confirm": return dialogModalConfirmHandler(sageInteraction as SageButtonInteraction, idParts);
		case "No": return dialogModalNoHandler(sageInteraction as SageButtonInteraction);
		case "Submit": return dialogModalSubmitHandler(sageInteraction as SageModalInteraction, idParts);
		case "Yes": return dialogModalYesHandler(sageInteraction as SageButtonInteraction, idParts);
		default: return sageInteraction.whisper("Something went wrong!");
	}
}

//#endregion

//#region create modal

function createGmModal(idParts: CustomIdParts, gmName: string): ModalBuilder {
	const modal = new ModalBuilder();
	modal.setTitle("GM / NPC Dialog");
	modal.setCustomId(createCustomId(idParts, "Submit"));
	addShortText(modal).setCustomId("dialogWho").setLabel("Character Name").setValue("").setPlaceholder(`Leave blank for "${gmName}"`).setMaxLength(DiscordMaxValues.usernameLength);
	addShortText(modal).setCustomId("dialogImage").setLabel("Dialog Image Url").setValue("").setPlaceholder("This image will be to the right of the content.");
	addShortText(modal).setCustomId("dialogColor").setLabel("Embed Color").setValue("").setPlaceholder("This sets the color of the left sidebar. Format: #00AAFF").setMaxLength(10);
	addShortText(modal).setCustomId("dialogTitle").setLabel("Content Title").setValue("").setPlaceholder("This text will be bold above the content.");
	addParagraph(modal, true).setCustomId("dialogContent").setLabel("Content");
	return modal;
}
function createPcModal(idParts: CustomIdParts, pcName: string): ModalBuilder {
	const modal = new ModalBuilder();
	modal.setTitle("PC Dialog");
	modal.setCustomId(createCustomId(idParts, "Submit"));
	addShortText(modal).setCustomId("dialogWho").setLabel("Character Display Name").setValue("").setPlaceholder(`Leave blank for "${pcName}"`).setMaxLength(DiscordMaxValues.usernameLength);
	addShortText(modal).setCustomId("dialogTitle").setLabel("Content Title").setValue("").setPlaceholder("This text will be bold above the content.");
	addParagraph(modal, true).setCustomId("dialogContent").setLabel("Content");
	return modal;
}
function createModal(idParts: CustomIdParts): ModalBuilder {
	const modal = new ModalBuilder();
	modal.setTitle("Character Dialog");
	modal.setCustomId(createCustomId(idParts, "Submit"));
	addShortText(modal, true).setCustomId("dialogWho").setLabel("Character Name").setValue("").setPlaceholder("").setMaxLength(DiscordMaxValues.usernameLength);
	addShortText(modal).setCustomId("dialogImage").setLabel("Dialog Image Url").setValue("").setPlaceholder("This image will be to the right of the content.");
	addShortText(modal).setCustomId("dialogColor").setLabel("Embed Color").setValue("").setPlaceholder("This sets the color of the left sidebar. Format: #00AAFF").setMaxLength(10);
	addShortText(modal).setCustomId("dialogTitle").setLabel("Content Title").setValue("").setPlaceholder("This text will be bold above the content.");
	addParagraph(modal, true).setCustomId("dialogContent").setLabel("Content");
	return modal;
}

function isPromptForModal(sageMessage: SageMessage): TCommandAndArgs | null {
	if (sageMessage.hasCommandOrQueryOrSlicedContent) return null;
	if (!sageMessage.slicedContent.match(/^dialog::/i)) return null;
	return { command:"DialogModal" };
}
function createCharacterSelect(): ActionRowBuilder<StringSelectMenuBuilder> {
	return new ActionRowBuilder<StringSelectMenuBuilder>()
		.addComponents(new StringSelectMenuBuilder().setCustomId(`char-selector`).setPlaceholder("Please select character ...").addOptions({ label:"Default", value:"Default" }));
}
function createSidebarSelect(): ActionRowBuilder<StringSelectMenuBuilder> {
	return new ActionRowBuilder<StringSelectMenuBuilder>()
		.addComponents(new StringSelectMenuBuilder().setCustomId(`sidebar-selector`).setPlaceholder("Please select sidebar color ...").addOptions({ label:"Default", value:"Default" }));
}
function createYesNoButton(idParts: CustomIdParts, action: "Yes" | "No"): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(createCustomId(idParts, action))
		.setLabel(action)
		.setStyle(action === "Yes" ? ButtonStyle.Success : ButtonStyle.Secondary);
}
function createYesNoButtons(idParts: CustomIdParts): ActionRowBuilder<ButtonBuilder> {
	return new ActionRowBuilder<ButtonBuilder>()
		.addComponents(createYesNoButton(idParts, "Yes"), createYesNoButton(idParts, "No"));
}
export async function promptForModal(sageCommand: SageCommand, dialogContent?: TDialogContent): Promise<void> {
	const channel = sageCommand.dChannel as DChannel;
	if (channel.isTextBased()) {
		const charType = dialogContent?.type ?? sageCommand.isPlayer ? "pc" : "gm";
		const charId = sageCommand.isPlayer ? (await sageCommand.fetchPlayerCharacter())?.id ?? NIL_UUID : NIL_UUID;
		const idParts: CustomIdParts = { indicator:"DialogModal", userDid:sageCommand.actor.did, charId, charType, action:"Cancel" };
		channel.send({
			content: `Did you want help posting dialog? ${userMention(sageCommand.actor.did)}`,
			components: [createCharacterSelect(), createSidebarSelect(), createYesNoButtons(idParts)]
		})
	}
}

//#endregion

//#region modal submit handlers

async function dialogModalSubmitHandler(sageInteraction: SageModalInteraction, idParts: CustomIdParts): Promise<void> {
	const form = sageInteraction.getModalForm<DialogForm>();
	if (form) {
		console.log({idParts,form});
		return sageInteraction.whisper("We aren't doing this yet!");
	}
	return sageInteraction.whisper("How did we get here? (should not see this)");
}
// async function dialogModalConfirmHandler(sageInteraction: SageButtonInteraction, idParts: CustomIdParts): Promise<void> {
// 	idParts
// 	return sageInteraction.whisper("Failure!");
// }
// async function dialogModalCancelHandler(sageInteraction: SageButtonInteraction, idParts: CustomIdParts): Promise<void> {
// 	idParts
// 	return sageInteraction.whisper("Nevermind!");
// }
async function dialogModalYesHandler(sageInteraction: SageButtonInteraction, idParts: CustomIdParts): Promise<void> {
	if (sageInteraction.game) {
		if (sageInteraction.isGameMaster) {
			return sageInteraction.interaction.showModal(createGmModal(idParts, sageInteraction.game.gmCharacterName));
		}
		if (sageInteraction.isPlayer) {
			const pc = await sageInteraction.fetchPlayerCharacter();
			if (pc) {
				return sageInteraction.interaction.showModal(createPcModal(idParts, pc.name));
			}
			return sageInteraction.whisper("You don't have a PC in this game yet!");
		}
	}
	return sageInteraction.interaction.showModal(createModal(idParts));
}
async function dialogModalNoHandler(sageInteraction: SageButtonInteraction): Promise<void> {
	if (sageInteraction.interaction.message.deletable) {
		await sageInteraction.interaction.message.delete();
	}
}

//#endregion

export function registerCommandHandlers(): void {
	registerInteractionListener(dialogModalTester, dialogModalHandler);
	registerMessageListener(isPromptForModal, promptForModal);
	// registerInteractionListener(isDialogModalInteraction, sendDialogModal);
}
