import { debug } from "@rsc-utils/console-utils";
import { EmojiIdentifierResolvable, Message, MessageActionRow, MessageButton, MessageButtonStyle, MessageSelectMenu } from "discord.js";
import type { Encounter } from "./Encounter";

type EncounterStatusActionType = "start" | "stop" | "charSelect";

type ButtonOptions = {
	encounter: Encounter;
	action: EncounterStatusActionType;
	style?: MessageButtonStyle;
	emoji?: EmojiIdentifierResolvable;
	label: string;
};

function getCustomId({ encounter, action }: ButtonOptions): string {
	return `encounter-${encounter.id}-status-action-${action}`;
}

function createButton(options: ButtonOptions): MessageButton {
	const button = new MessageButton()
		.setCustomId(getCustomId(options))
		.setLabel(options.label)
		.setStyle(options.style ?? "SECONDARY");
	if (options.emoji) {
		button.setEmoji(options.emoji);
	}
	return button;
}

function createCharacterSelector(encounter: Encounter): MessageActionRow<MessageSelectMenu> {
	const select = new MessageSelectMenu()
		.setCustomId(getCustomId({ encounter, action:"charSelect" } as ButtonOptions));
	const characters = encounter.getSortedCharacters();
	characters.forEach(char => {
		debug({ label:char.name, value:char.id });
		select.addOptions({ label:char.name, value:char.id });
	});
	return new MessageActionRow<MessageSelectMenu>().addComponents(select);
}

export async function addButtons(encounter: Encounter, message: Message, gmMode = false): Promise<void> {
	if (!message.editable) {
		return;
	}

	const isActive = encounter.active;

	const components: MessageActionRow[] = [];

	if (gmMode) {
		components.push(createCharacterSelector(encounter));
	}

	const startStop = createButton({ encounter, action:isActive?"stop":"start", emoji:isActive?"⏹️":"▶️", label:isActive?"Stop":"Start" });
	const buttonRow = new MessageActionRow<MessageButton>().addComponents(startStop);
	components.push(buttonRow);

	await message.edit({ content:message.content, embeds:message.embeds, components });
}