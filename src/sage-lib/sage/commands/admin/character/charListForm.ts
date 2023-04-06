import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Snowflake, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { registerInteractionListener } from "../../../../discord/handlers.js";
import { CharacterManager } from "../../../model/CharacterManager.js";
import { SageMessage } from "../../../model/SageMessage.js";
import { SageInteraction } from "../../../model/SageInteraction.js";
import { UUID } from "../../../../../sage-utils/UuidUtils/types.js";
import { sendCharModal } from "./charModal.js";


//#region customId

type CharListFormIndicator = "CharListForm";
type CharListFormAction = "CharType" | "EditButton";
type CustomIdParts = {
	/** indicator that this control belongs to this form */
	indicator: CharListFormIndicator;

	/** User DID */
	userDid: Snowflake;

	/** Action */
	action: CharListFormAction;
};

function createCustomId(userDid: Snowflake, action: CharListFormAction): string {
	return `CharListForm|${userDid}|${action}`;
}

function parseCustomId(customId: string): CustomIdParts | null {
	const match = customId.match(/(CharListForm)\|(\d{16,})\|(CharType|EditButton)/);
	if (match) {
		return {
			indicator: match[1] as CharListFormIndicator,
			userDid: match[2],
			action: match[3] as CharListFormAction
		};
	}
	return null;
}

//#endregion

type FormData = {
	userDid: Snowflake;
	messageDid?: Snowflake;
	charType?: "pc" | "npc" | "game-gm" | "game-pc" | "game-npc";
	activeChar?: UUID;
	activeCompanion?: UUID;
};

const activeForms = new Map<Snowflake, FormData>();

function getOrCreateFormData(userDid: Snowflake): FormData {
	if (!activeForms.has(userDid)) {
		activeForms.set(userDid, { userDid });
	}
	return activeForms.get(userDid)!;
}

function createCharTypeSelect(label: string, value: string, _description:string, formData: FormData): StringSelectMenuOptionBuilder {
	return StringSelectMenuOptionBuilder.from({ label, value, default: formData.charType === value, emoji:undefined });
	// return StringSelectMenuOptionBuilder.from({ label, value, description, default: formData.charType === value, emoji:undefined });
}

export async function sendCharListForm(sageMessage: SageMessage, characterManager?: CharacterManager): Promise<void> {
	const formData = getOrCreateFormData(sageMessage.actor.did);

	const charTypeList = new StringSelectMenuBuilder();
	charTypeList.setCustomId(createCustomId(sageMessage.actor.did, "CharType"));
	charTypeList.setPlaceholder("Which type of characters?");
	if (sageMessage.game) {
		if (sageMessage.isGameMaster) {
			charTypeList.addOptions([
				createCharTypeSelect("Game Master (GM)", "game-gm", "Select the Game Master.", formData),
				createCharTypeSelect("Game Non-Player Characters (NPC)", "game-npc", "Select from the Game Non-Player Characters.", formData),
			]);
		}
		charTypeList.addOptions([
			createCharTypeSelect("Game Player Characters (PC)", "game-pc", "Select from the Game Player Characters.", formData),
		]);
	}
	charTypeList.addOptions([
		createCharTypeSelect("Player Characters (PC)", "pc", "Select from your Player Characters.", formData),
		createCharTypeSelect("Non-Player Characters (NPC)", "npc", "Select from your Non-Player Characters.", formData),
	]);

	const charTypeRow = new ActionRowBuilder<StringSelectMenuBuilder>();
	charTypeRow.addComponents(charTypeList);

	const editButton = new ButtonBuilder();
	editButton.setCustomId(createCustomId(sageMessage.actor.did, "EditButton"));
	editButton.setDisabled(false);
	editButton.setLabel("Edit");
	editButton.setStyle(ButtonStyle.Primary);

	const buttonRow = new ActionRowBuilder<ButtonBuilder>();
	buttonRow.addComponents(editButton);

	characterManager;

	const msg = await sageMessage.message.channel.send({
		content: "Test Form",
		components: [charTypeRow, buttonRow]
	});
	formData.messageDid = msg.id;
}

function charListFormTester(sageInteraction: SageInteraction): CustomIdParts | null {
	return sageInteraction.parseCustomId(parseCustomId);
}
async function charListFormHandler(sageInteraction: SageInteraction, idParts: CustomIdParts): Promise<void> {
	if (idParts.userDid !== sageInteraction.actor.did) {
		// ask them what they are trying to do? tell them to piss off!
		return sageInteraction.whisper("Please don't touch another user's characters!");
	}
	await sendCharModal(sageInteraction);
}

export function registerCommandHandlers(): void {
	registerInteractionListener(charListFormTester, charListFormHandler);
}
