// import { discordPrompt } from "../../../../discord/prompts";
// import type { SageMessage } from "../../../model/SageMessage";
// import { registerAdminCommand } from "../../cmd";

// // const POINT_RIGHT = "➡️";
// const POINT_RIGHT = "👉";

// function createMenuResponseMap(): Map<string, string> {
// 	const responseMap = new Map<string, string>();
// 	responseMap.set("⬆️", "up");
// 	responseMap.set("⬇️", "down");
// 	responseMap.set("<:checked:755623355737964604>", "checked");
// 	responseMap.set("<:unchecked:755623355775713280>", "unchecked");
// 	// responseMap.set("🔀", "alt");
// 	responseMap.set("👍", "next");
// 	return responseMap;
// }
// /*
// 			async function editChat(sageMessage: SageMessage): Promise<void> {
// 				const messageDid = sageMessage.args[DialogArgIndex.Name],
// 					message = await findLastMessage(sageMessage, messageDid).catch(ex => <any>error(ex) || null);
// 				if (!message) return sageMessage.reactWarn();

// 				let embed = message.embeds[0];
// 				let updatedTitle = sageMessage.args[DialogArgIndex.Name] && !isSnowflake(sageMessage.args[DialogArgIndex.Name]) && sageMessage.args[DialogArgIndex.Name]
// 					|| sageMessage.args[DialogArgIndex.DisplayName] && !isSnowflake(sageMessage.args[DialogArgIndex.DisplayName]) && sageMessage.args[DialogArgIndex.DisplayName];
// 				let updatedContent = sageMessage.args[DialogArgIndex.Content];
// 				message.edit(updateEmbed(embed, updatedTitle, updatedContent)).then(deleteMessage, error);
// 			}
// */

// function channelWizardRenderable(title: string, gameChannels: TGameChannels, currentIndex: number): RenderableContent {
// 	const renderableContent = new RenderableContent(title);
// 	renderableContent.appendTitledSection(`<b>Channel Options</b>`);
// 	const gameChannelKeys = Object.keys(gameChannels);
// 	gameChannelKeys.forEach((key, index) => {
// 		const gameChannel = gameChannels[key];
// 		const spacer = index === currentIndex ? POINT_RIGHT : "[spacer]";
// 		const checked = gameChannel.checked ? "[checked]" : "[unchecked]";
// 		renderableContent.append(`${spacer}${checked} #${gameChannel.name}`);
// 	});
// 	return renderableContent;
// }
// async function channelWizard(sageMessage: SageMessage, title: string, gamePrefix: string): Promise<TGameChannels> {
// 	let menuIndex = 0;
// 	// menuNext = false;

// 	const gameChannels = compileChannels(gamePrefix, sageMessage.message);
// 	const gameChannelKeys = Object.keys(gameChannels);
// 	const responseMap = createMenuResponseMap();

// 	const renderableContent = channelWizardRenderable(title, gameChannels, 0);
// 	await discordPrompt(sageMessage, renderableContent, responseMap, async reaction => {
// 		if (reaction === "up") {
// 			menuIndex--;
// 			if (menuIndex < 0) {
// 				menuIndex = gameChannelKeys.length - 1;
// 			}
// 		}
// 		else if (reaction === "down") {
// 			menuIndex++;
// 			if (menuIndex === gameChannelKeys.length) {
// 				menuIndex = 0;
// 			}
// 		}
// 		else if (reaction === "checked") {
// 			const channel = gameChannels[gameChannelKeys[menuIndex]];
// 			if (channel.checked) {
// 				const names = channel.names ?? [channel.name];
// 				if (names.length > 1) {
// 					const nameIndex = names.indexOf(channel.name);
// 					channel.name = names[nameIndex + 1] ?? names[0];
// 				}
// 			} else {
// 				channel.checked = true;
// 			}
// 		}
// 		else if (reaction === "unchecked") {
// 			gameChannels[gameChannelKeys[menuIndex]].checked = false;
// 		}
// 		// else if (reaction === "alt") { }
// 		else { return null; }
// 		return channelWizardRenderable(title, gameChannels, menuIndex);
// 	}).catch(errorReturnNull);

// 	return gameChannels;
// }

// async function gameWizard(sageMessage: SageMessage): Promise<void> {
// 	if (!sageMessage.canAdminGames) {
// 		return sageMessage.reactBlock();
// 	}

// 	// const mentions = sageMessage.message.mentions;

// 	const nameInput = sageMessage.args.join(" ");
// 	const foundPrefix = nameInput.match(/\([^\)]+\)/i);
// 	const gamePrefix = foundPrefix ? foundPrefix[0].slice(1, -1) : nameInput.split(" ").map(s => s[0]).join("");

// 	const nameLower = nameInput.replace(`(${gamePrefix})`, "").trim().toLowerCase();
// 	const prefixLower = gamePrefix.trim().toLowerCase();

// 	const gameChannels = await channelWizard(sageMessage, `<u><b>New Game Wizard:</b> ${nameLower}</u>`, prefixLower);
// 	debug(stringify(gameChannels));

// 	/*
// 	// const members = Array.from(mentions.members.values());
// 	// debug("members");
// 	// members.forEach(member => debug("@"+member.user.tag));

// 	// const roles = Array.from(mentions.roles.values());
// 	// debug("roles");
// 	// roles.forEach(role => debug("@"+role.name));

// 	// const users = Array.from(mentions.users.values());
// 	// debug("users");
// 	// users.forEach(user => debug("@"+user.tag));
// 	*/
// }

// type TGameChannel = {
// 	did?: Discord.Snowflake;
// 	name: string;
// 	names?: string[];
// 	checked?: boolean;
// }
// type TGameChannels = {
// 	gameMastersOnly: TGameChannel;
// 	inCharacter: TGameChannel;
// 	miscPlanning: TGameChannel;
// 	outOfCharacter: TGameChannel;
// 	playersOnly: TGameChannel;
// 	rulesNotes: TGameChannel;
// 	[key: string]: TGameChannel;
// };
// function compileChannels(gamePrefix: string, message: Discord.Message | Discord.PartialMessage): TGameChannels {
// 	const gameChannels: TGameChannels = {
// 		rulesNotes: { name: `${gamePrefix}-house-rules-notes`, names: [`${gamePrefix}-house-rules-notes`, `${gamePrefix}-rules-notes`, `${gamePrefix}-rules`, `${gamePrefix}-notes`] },
// 		miscPlanning: { name: `${gamePrefix}-misc-planning`, names: [`${gamePrefix}-misc-planning`, `${gamePrefix}-misc`, `${gamePrefix}-planning`] },
// 		playersOnly: { name: `${gamePrefix}-players-only`, names: [`${gamePrefix}-players-only`, `${gamePrefix}-players`] },
// 		outOfCharacter: { name: `${gamePrefix}-out-of-character`, names: [`${gamePrefix}-out-of-character`, `${gamePrefix}-ooc`] },
// 		inCharacter: { name: `${gamePrefix}-in-character`, names: [`${gamePrefix}-in-character`, `${gamePrefix}-ic`] },
// 		gameMastersOnly: { name: `${gamePrefix}-gamemasters-only`, names: [`${gamePrefix}-gamemasters-only`, `${gamePrefix}-gamemasters`, `${gamePrefix}-gms-only`, `${gamePrefix}-gms`] }
// 	};
// 	const textChannel = <Discord.TextChannel>message.channel,
// 		category = textChannel.parent,
// 		categoryChannels = category && <Discord.TextChannel[]>Array.from(category.children.values()) || [],
// 		mentionChannels = Array.from(message.mentions.channels.values()),
// 		channels = mentionChannels.concat(categoryChannels);
// 	channels.forEach(channel => {
// 		const nameLower = (<Discord.BaseGuildTextChannel>channel).name?.toLowerCase() ?? "";
// 		if (nameLower.includes("-rules") || nameLower.includes("-notes")) {
// 			if (!gameChannels.rulesNotes.did) {
// 				gameChannels.rulesNotes.did = channel.id;
// 			}
// 		} else if (nameLower.includes("-misc") || nameLower.includes("-planning")) {
// 			if (!gameChannels.miscPlanning.did) {
// 				gameChannels.miscPlanning.did = channel.id;
// 			}
// 		} else if (nameLower.includes("-player") || nameLower.includes("-pc")) {
// 			if (!gameChannels.playersOnly.did) {
// 				gameChannels.playersOnly.did = channel.id;
// 			}
// 		} else if (nameLower.includes("-ic") || nameLower.includes("-in-character")) {
// 			if (!gameChannels.inCharacter.did) {
// 				gameChannels.inCharacter.did = channel.id;
// 			}
// 		} else if (nameLower.includes("-ooc") || nameLower.includes("-out-of-character")) {
// 			if (!gameChannels.outOfCharacter.did) {
// 				gameChannels.outOfCharacter.did = channel.id;
// 			}
// 		} else if (nameLower.includes("-gamemaster") || nameLower.includes("-gm")) {
// 			if (!gameChannels.gameMastersOnly.did) {
// 				gameChannels.gameMastersOnly.did = channel.id;
// 			}
// 		}
// 	});
// 	return gameChannels;
// }

// export function register(): void {
// 	registerAdminCommand(gameWizard, "new game");
// }
