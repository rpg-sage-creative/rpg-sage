import { DialogPostType, type SageChannel } from "@rsc-sage/types";
import { debug, type Snowflake } from "@rsc-utils/core-utils";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, type GuildTextBasedChannel, type SelectMenuComponentOptionData } from "discord.js";
import { getSelectedOrDefault } from "../../../../../gameSystems/p20/lib/getSelectedOrDefault.js";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import type { AutoChannelData, GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { SageInteraction } from "../../../model/SageInteraction.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { createMessageDeleteButton } from "../../../model/utils/deleteButton.js";
import { getCharacter } from "./getCharacter.js";
import { getCharacterTypeMeta, type TCharacterTypeMeta } from "./getCharacterTypeMeta.js";
import { testCanAdminCharacter } from "./testCanAdminCharacter.js";
import { toReadableOwner } from "./toReadableOwner.js";
import { toHumanReadable } from "@rsc-utils/discord-utils";

//#region customId

type Action = "channel" | "off" | "on" | "embed" | "post";

function createCustomId(userId: Snowflake, action: Action, characterId: string | undefined): string {
	return ["autoDialog", userId, action].concat(characterId ? [characterId] : []).join("|");
}

function customIdParser(customId?: string | null) {
	if (!customId) return undefined;
	const [indicator, userId, action, characterId] = customId.split("|");
	return { indicator, userId:userId as Snowflake, action:action as Action, characterId:characterId as Snowflake | undefined };
}

//#endregion

//#region AutoChannel

type State = "off" | "on" | "embed" | "post";

type ChannelData = `${Snowflake}|${State}|${Snowflake}`;

function stringifyAutoChannel(autoChannel: AutoChannelData): ChannelData {
	return [
		autoChannel.channelDid,
		DialogPostType[autoChannel.dialogPostType!]?.toLowerCase() ?? "",
		autoChannel.userDid ?? ""
	].join("|") as ChannelData;
}

type SelectedChannelData = AutoChannelData & { state:State; };

function parseAutoChannel(channelData: ChannelData | undefined): SelectedChannelData | undefined {
	if (channelData) {
		const [channelDid, state, userDid] = channelData.split("|") as [Snowflake, State, Snowflake];
		return {
			channelDid,
			dialogPostType: state === "embed" ? DialogPostType.Embed : state === "post" ? DialogPostType.Post : undefined,
			userDid: userDid ? userDid : undefined,
			state: state ? state : "on"
		};
	}
	return undefined;
}

function isSameChannel(autoChannel: AutoChannelData | undefined, gameChannel: SageChannel | undefined): boolean {
	return autoChannel && gameChannel
		? autoChannel.channelDid === gameChannel.did || autoChannel.channelDid === gameChannel.id
		: false;
}

//#endregion

// function getAutoCharactersForChannel(charManager: CharacterManager, channelId: Snowflake, userId?: Snowflake): GameCharacter[] {
// 	const characters: GameCharacter[] = [];

// 	const genericAutoChannel = { channelDid:channelId };
// 	const specificAutoChannel = { channelDid:channelId, userDid:userId };
// 	const testChar = (char: GameCharacter) => char.hasAutoChannel(genericAutoChannel) || char.hasAutoChannel(specificAutoChannel);

// 	// get user characters of this type with auto channels in this channel
// 	charManager.forEach(char => {
// 		if (testChar(char)) characters.push(char);
// 		char.companions.forEach(comp => {
// 			if (testChar(comp)) characters.push(comp);
// 		});
// 	});

// 	return characters;
// }

// async function getCharacters(sageCommand: SageCommand, characterTypeMeta: TCharacterTypeMeta): Promise<GameCharacter[]> {
// 	if (characterTypeMeta.isGm) {
// 		return [sageCommand.gmCharacter];
// 	}

// 	const characters: GameCharacter[] = [];

// 	const { game, sageUser } = sageCommand;
// 	const gameChannels = game?.channels ?? [];

// 	// we primarily want game characters, but we need to let them turn off accidental user characters
// 	if (game) {
// 		if (characterTypeMeta.isGmOrNpcOrMinion) {
// 			characters.push(...game.nonPlayerCharacters);
// 			game.nonPlayerCharacters.forEach(char => characters.push(...char.companions));
// 		}
// 		if (characterTypeMeta.isPcOrCompanion) {
// 			characters.push(...game.playerCharacters);
// 			game.playerCharacters.forEach(char => characters.push(...char.companions));
// 		}

// 		// get user characters of this type with auto channels in this game

// 		// get user characters of this type with auto channels in this channel

// 	// here we are just dealing with user characters
// 	}else {

// 	}

// 	const channelId: Snowflake | undefined = sageCommand.dChannel?.id as Snowflake;
// 	const channelIsInGame = channelId ? gameChannels.some(gameChannel => gameChannel.did === channelId || gameChannel.id === channelId) : false;
// 	if (characterTypeMeta.isPcOrCompanion && channelId && !channelIsInGame) {
// 		const genericAutoChannel = { channelDid:channelId };
// 		const specificAutoChannel = { channelDid:channelId, userDid:sageUser.did??sageUser.id };
// 		sageUser.playerCharacters.forEach(char => {
// 			if (char.hasAutoChannel(genericAutoChannel) || char.hasAutoChannel(specificAutoChannel)) characters.push(char);
// 			char.companions.forEach(comp => {
// 				if (comp.hasAutoChannel(genericAutoChannel) || comp.hasAutoChannel(specificAutoChannel)) characters.push(comp);
// 			});
// 		});
// 	}

// 	return characters;
// }

async function getAutoCharacter(sageCommand: SageCommand, characterTypeMeta: TCharacterTypeMeta): Promise<GameCharacter | undefined> {
	if (characterTypeMeta.isGm) {
		if (sageCommand.isGameMaster) return sageCommand.gmCharacter;
		return undefined;
	}

	const userId = sageCommand.sageUser.did;
	const names = sageCommand.args.getNames();
	const character = await getCharacter(sageCommand, characterTypeMeta, userId, names);
	if (character) {
		return character;
	}
	if (characterTypeMeta.isPc) {
		return sageCommand.playerCharacter;
	}
	return undefined;
}

type Char = { id:Snowflake; char:GameCharacter; game?:GameCharacter; user?:GameCharacter; };
function getCharacterById(sageCommand: SageCommand, id: Snowflake): Char | undefined {
	if (sageCommand.gmCharacter.equals(id)) {
		return { id, char:sageCommand.gmCharacter, game:sageCommand.gmCharacter };
	}

	const game = sageCommand.game?.playerCharacters.findById(id)
		?? sageCommand.game?.nonPlayerCharacters.findById(id);
	if (game) {
		return { id, char:game, game };
	}

	const user = sageCommand.sageUser.playerCharacters.findById(id);
	if (user) {
		return { id, char:user, user };
	}

	return undefined;
}

function getGameCharacterByName(sageCommand: SageCommand, name: string): GameCharacter | undefined {
	if (sageCommand.gmCharacter.matches(name)) {
		return sageCommand.gmCharacter;
	}
	return sageCommand.game?.playerCharacters.findByName(name)
		?? sageCommand.game?.playerCharacters.findCompanion(name)
		?? sageCommand.game?.nonPlayerCharacters.findByName(name)
		?? sageCommand.game?.nonPlayerCharacters.findCompanion(name);
}

function getUserCharacterByName(sageCommand: SageCommand, name: string): GameCharacter | undefined {
	return sageCommand.sageUser.playerCharacters.findByName(name)
		?? sageCommand.sageUser.playerCharacters.findCompanion(name);
}

type Chars = { id:Snowflake; name:string; byId:Char; byName?:Char; all:GameCharacter[]; };
function getCharsById(sageCommand: SageCommand, id: Snowflake): Chars;
function getCharsById(sageCommand: SageCommand, id?: Snowflake): Chars | undefined;
function getCharsById(sageCommand: SageCommand, id?: Snowflake): Chars | undefined {
	if (!id) return undefined;

	const byId = getCharacterById(sageCommand, id);
	if (!byId) return undefined;

	const { game, user } = byId;

	const name = game?.name ?? user?.name!;

	const gameByName = !game ? getGameCharacterByName(sageCommand, name) : undefined;
	const userByName = !user ? getUserCharacterByName(sageCommand, name) : undefined;
	const byName = gameByName || userByName
		? { id:gameByName?.id ?? userByName?.id!, char:gameByName ?? userByName!, game:gameByName, user:userByName }
		: undefined;

	const all = [game!, user!, gameByName!, userByName!].filter(c => c);

	return { id, name, byId, byName, all };
}

async function createChannelList(sageCommand: SageCommand, chars: Chars, selectedValue?: ChannelData): Promise<ActionRowBuilder<StringSelectMenuBuilder>> {
	const userId = sageCommand.sageUser.did;
	const serverId = sageCommand.server.did;

	const select = new StringSelectMenuBuilder();
	select.setCustomId(createCustomId(userId, "channel", chars.id));
	select.setPlaceholder(`Select a Channel ...`);

	const addOption = (data: SelectMenuComponentOptionData) => {
		data.default = data.value === selectedValue;
		select.addOptions(new StringSelectMenuOptionBuilder(data));
	};

	const toUserName = async (userId: Snowflake) => {
		const userName = await toReadableOwner(sageCommand, userId);
		return userName ?? `@${userId}`;
	};

	const labelAutoChannel = async (autoChannel: AutoChannelData, force?: boolean) => {
		const channel = await sageCommand.discord.fetchChannel<GuildTextBasedChannel>({ guildId:serverId, channelId:autoChannel.channelDid });
		if (!channel && !force) return undefined;
		const channelLabel = channel?.name ?? `#${autoChannel.channelDid}`;
		const userName = autoChannel.userDid ? ` ${await toUserName(autoChannel.userDid)}` : "";
		const postType = autoChannel.dialogPostType !== undefined ? ` (${DialogPostType[autoChannel.dialogPostType]})` : "";
		return channelLabel + userName + postType;
	};

	// add game channels first

	const gameChannels = sageCommand.game?.channels ?? [];
	for (const gameChannel of gameChannels) {
		let added = false;
		for (const character of chars.all) {
			const autoChannels = character.autoChannels.filter(autoChannel => isSameChannel(autoChannel, gameChannel));
			if (autoChannels.length) {
				for (const autoChannel of autoChannels) {
					const label = await labelAutoChannel(autoChannel, true);
					const value = stringifyAutoChannel(autoChannel);
					const description = character === chars.byId.game || character === chars.byName?.game ? "Game Character" : "User Character";
					if (label) {
						addOption({ label, value, description });
						added = true;
					}
				}
			}
		}

		if (!added) {
			const autoChannel = { channelDid:gameChannel.did ?? gameChannel.id };
			const label = await labelAutoChannel(autoChannel);
			const value = stringifyAutoChannel(autoChannel);
			if (label) addOption({ label, value });
		}
	}

	// add non-game auto channels last
	for (const character of chars.all) {
		const autoChannels = character.autoChannels.filter(autoChannel => !gameChannels.some(gameChannel => isSameChannel(autoChannel, gameChannel)));
		for (const autoChannel of autoChannels) {
			const label = await labelAutoChannel(autoChannel, true);
			const value = stringifyAutoChannel(autoChannel);
			if (label) addOption({ label, value });
		}
	}

	return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

function createButtonRow(sageCommand: SageCommand, chars: Chars, selectedValue?: ChannelData): ActionRowBuilder<ButtonBuilder> {
	const userId = sageCommand.sageUser.did;
	const acParsed = parseAutoChannel(selectedValue);
	const character = chars.all.find(char => char.id === chars.id);
	const acFound = character?.autoChannels.find(ac => ac.channelDid === acParsed?.channelDid && ac.dialogPostType === acParsed?.dialogPostType && ac.userDid === acParsed?.userDid);
	const state = acFound ? acParsed?.state : "off";

	const createButton = (action: Action, label: string) => new ButtonBuilder().setCustomId(createCustomId(userId, action, character?.id)).setLabel(label).setStyle(ButtonStyle.Primary).setDisabled(!selectedValue || state === action);

	const offButton = createButton("off", "Off");
	const onButton = createButton("on", "On (Default)");
	const embedButton = createButton("embed", " On (Embed)");
	const postButton = createButton("post", "On (Post)");
	const deleteButton = createMessageDeleteButton(userId, { label:"Done" });

	return new ActionRowBuilder<ButtonBuilder>().setComponents(offButton, onButton, embedButton, postButton, deleteButton);
}

async function createComponents(sageCommand: SageCommand, chars: Chars, selectedValue?: ChannelData): Promise<[ActionRowBuilder<StringSelectMenuBuilder>, ActionRowBuilder<ButtonBuilder>]> {
	const selectRow = await createChannelList(sageCommand, chars, selectedValue);
	const buttonRow = createButtonRow(sageCommand, chars, selectedValue);
	return [selectRow, buttonRow];
}

async function handleAction(sageInteraction: SageInteraction<ButtonInteraction|StringSelectMenuInteraction>): Promise<void> {
	sageInteraction.replyStack.defer();

	const { sageUser } = sageInteraction;

	const { userId, action, characterId } = sageInteraction.parseCustomId(customIdParser)!;
	if (!sageUser.equals(userId)) {
		await sageInteraction.replyStack.reply("Please don't touch another user's control.");
		return;
	}

	const chars = getCharsById(sageInteraction, characterId);
	const character = chars?.byId.char;
	let channelData = getSelectedOrDefault(sageInteraction as SageInteraction<StringSelectMenuInteraction>, createCustomId(userId, "channel", characterId)) as ChannelData;
	const autoChannel = parseAutoChannel(channelData);
	if (!character || !autoChannel) return;

	const channelId = autoChannel.channelDid;
	const removeAutoChannel = async (save?: boolean, force?: boolean) => {
		if (force || sageUser.equals(autoChannel.userDid)) {
			await character.removeAutoChannel(autoChannel, save);
		}
	};
	const setAutoChannel = async (channelDid: Snowflake, userDid: Snowflake, dialogPostType?: DialogPostType) => {
		await character.setAutoChannel({ channelDid, userDid, dialogPostType }, true);
		channelData = `${channelDid}|${DialogPostType[dialogPostType!]?.toLowerCase() ?? ""}|${userDid}` as ChannelData;
	};

	switch(action) {
		case "channel":
			// do nothing
			break;

		case "off":
			await removeAutoChannel(true, true);
			channelData = `${channelId}||` as ChannelData;
			break;

		case "on":
			await removeAutoChannel();
			await setAutoChannel(channelId, userId);
			break;

		case "embed":
			await removeAutoChannel();
			await setAutoChannel(channelId, userId, DialogPostType.Embed);
			break;

		case "post":
			await removeAutoChannel();
			await setAutoChannel(channelId, userId, DialogPostType.Post);
			break;

		default:
			debug(`Invalid customId: ${sageInteraction.interaction.customId}`);
			break;
	}

	const message = sageInteraction.interaction.message;
	message.edit({ content:message.content, components:await createComponents(sageInteraction, chars, channelData)})
}

export async function showForm(sageMessage: SageMessage): Promise<void> {
	const characterTypeMeta = getCharacterTypeMeta(sageMessage);
	if (!testCanAdminCharacter(sageMessage, characterTypeMeta)) {
		if (!sageMessage.allowCommand) {
			return sageMessage.replyStack.whisper(`Sorry, you cannot manage characters here.`);
		}
		if (sageMessage.game) {
			if (!sageMessage.canAdminGame && !sageMessage.isPlayer) {
				return sageMessage.replyStack.whisper(`Sorry, you are not part of this Game.`);
			}
			if (characterTypeMeta.isGmOrNpcOrMinion && !sageMessage.canAdminGame) {
				return sageMessage.replyStack.whisper(`Sorry, only GMs and Admins can manage NPCs.`);
			}
		}else if (characterTypeMeta.isGmOrNpcOrMinion) {
			return sageMessage.replyStack.whisper(`Sorry, NPCs only exist inside a Game.`);
		}
		return sageMessage.replyStack.whisper(`I'm sorry Dave, I'm afraid I can't do that.`);
	}

	const character = await getAutoCharacter(sageMessage, characterTypeMeta);
	if (!character) {
		const nameLabel = sageMessage.args.getNames().name ?? characterTypeMeta.singularDescriptor;
		await sageMessage.replyStack.whisper(`Unable to find character: ${nameLabel}`);
		return;
	}

	const content = `Configuring Auto Dialog for:\n> **User** ${toHumanReadable(sageMessage.message.author)}\n> **Character** ${character.name}`;
	const components = await createComponents(sageMessage, getCharsById(sageMessage, character.id));

	await sageMessage.replyStack.send({ content, components });
}

export function registerGcCmdAutoDialog(): void {
	registerListeners({ commands:["pc|auto|dialog", "gm|auto|dialog", "npc|auto|dialog", "minion|auto|dialog", "companion|auto|dialog"], message:showForm });
	registerListeners({ commands:[/autoDialog\|\d{16,}\|(channel|off|on|embed|post)(\|[\w-]+)*/], interaction:handleAction });
}