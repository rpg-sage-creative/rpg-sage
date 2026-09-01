import { debug } from "@rsc-utils/core-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, StringSelectMenuBuilder, type ComponentEmojiResolvable } from "discord.js";
import type { Encounter } from "./Encounter.js";

type EncounterStatusActionType = "start" | "stop" | "charSelect";

type ButtonOptions = {
	encounter: Encounter;
	action: EncounterStatusActionType;
	style?: ButtonStyle;
	emoji?: ComponentEmojiResolvable;
	label: string;
};

function getCustomId({ encounter, action }: ButtonOptions): string {
	return `encounter-${encounter.id}-status-action-${action}`;
}

function createButton(options: ButtonOptions): ButtonBuilder {
	const button = new ButtonBuilder()
		.setCustomId(getCustomId(options))
		.setLabel(options.label)
		.setStyle(options.style ?? ButtonStyle.Secondary);
	if (options.emoji) {
		button.setEmoji(options.emoji);
	}
	return button;
}

function createCharacterSelector(encounter: Encounter): ActionRowBuilder<StringSelectMenuBuilder> {
	const select = new StringSelectMenuBuilder()
		.setCustomId(getCustomId({ encounter, action:"charSelect" } as ButtonOptions));
	const characters = encounter.getSortedCharacters();
	characters.forEach(char => {
		debug({ label:char.name, value:char.id });
		select.addOptions({ label:char.name, value:char.id });
	});
	return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents([select]);
}

export async function addButtons(encounter: Encounter, message: Message, gmMode = false): Promise<void> {
	if (!message.editable) {
		return;
	}

	const isActive = encounter.active;

	const components: ActionRowBuilder<ButtonBuilder|StringSelectMenuBuilder>[] = [];

	if (gmMode) {
		components.push(createCharacterSelector(encounter));
	}

	const startStop = createButton({ encounter, action:isActive?"stop":"start", emoji:isActive?"⏹️":"▶️", label:isActive?"Stop":"Start" });
	const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(startStop);
	components.push(buttonRow);

	await message.edit({ content:message.content, embeds:message.embeds, components });
}