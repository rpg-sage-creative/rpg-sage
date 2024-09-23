import { getSuperUserId } from "@rsc-sage/env";
import { addLogHandler, captureProcessExit, error, errorReturnNull, formatArg, getCodeName, getDataRoot, info, verbose, type Snowflake } from "@rsc-utils/core-utils";
import { wrapUrl } from "@rsc-utils/discord-utils";
import { findJsonFile } from "@rsc-utils/io-utils";
import { chunk } from "@rsc-utils/string-utils";
import type { ClientOptions, Guild, Interaction, Message, MessageReaction, PartialMessage, PartialMessageReaction, PartialUser, User } from "discord.js";
import { ActivityType, Client } from "discord.js";
import { setDeleted } from "../../discord/deletedMessages.js";
import { getRegisteredIntents, getRegisteredPartials, handleInteraction, handleMessage, handleReaction } from "../../discord/handlers.js";
import { MessageType, ReactionType } from "../../discord/index.js";
import { Bot, type IBotCore } from "./Bot.js";
import { SageCache } from "./SageCache.js";

interface IClientEventHandler {
	onClientReady(client: Client): void;
	onClientGuildCreate(guild: Guild): void;
	// onClientGuildDelete(guild: Guild): void;
	// onClientGuildBanAdd(ban: GuildBan): void;
	// onClientGuildBanRemove(ban: GuildBan): void;
	// onClientGuildMemberUpdate(member: GuildMember | PartialGuildMember, originalMember: GuildMember): void;
	// onClientGuildMemberRemove(member: GuildMember | PartialGuildMember): void;
	onClientMessageCreate(message: Message): void;
	onClientMessageUpdate(originalMessage: Message | PartialMessage, message: Message | PartialMessage): void;
	onClientMessageReactionAdd(messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): void;
	onClientMessageReactionRemove(messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): void;
}

function createDiscordClientOptions(): ClientOptions {
	return {
		intents: getRegisteredIntents(),
		partials: getRegisteredPartials()
	};
}

export class ActiveBot extends Bot implements IClientEventHandler {
	public static active: ActiveBot;
	public static get isDev(): boolean { return ActiveBot.active?.codeName === "dev"; }
	public static async sendToSuperUser(...contents: string[]): Promise<void> {
		const user = await ActiveBot.active.sageCache.discord.fetchUser(getSuperUserId()).catch(errorReturnNull);
		if (user) {
			for (const content of contents) {
				user.send(wrapUrl(content, true));
			}
		}
	}

	// public client: Client;

	private constructor(core: IBotCore) {
		super(core, null!);

		const client = new Client(createDiscordClientOptions());

		ActiveBot.client = client;

		captureProcessExit(() => {
			info("Destroying Discord.Client");
			return ActiveBot.client.destroy();
		});

		// To see options, look for: Discord.ClientEvents (right click nav .on below)
		client.once("ready", this.onClientReady.bind(this));

		// TODO: if created in a game category i could add or prompt to add?
		// channelCreate: [channel: GuildChannel];
		// TODO: i should remove this from any game or server object ...
		// channelDelete: [channel: DMChannel | GuildChannel];
		// TODO: needed?
		// channelPinsUpdate: [channel: TextBasedChannels, date: Date];
		// channelUpdate: [oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel];

		client.on("guildCreate", this.onClientGuildCreate.bind(this));
		// client.on("guildDelete", this.onClientGuildDelete.bind(this));
		// TODO: What is unavailable?
		// guildUnavailable: [guild: Guild];
		// Use this to update server name?
		// guildUpdate: [oldGuild: Guild, newGuild: Guild];

		// client.on("guildBanAdd", this.onClientGuildBanAdd.bind(this));
		// client.on("guildBanRemove", this.onClientGuildBanRemove.bind(this));

		// client.on("guildMemberUpdate", this.onClientGuildMemberUpdate.bind(this));
		// client.on("guildMemberRemove", this.onClientGuildMemberRemove.bind(this));

		client.on("interactionCreate", this.onInteractionCreate.bind(this));

		client.on("messageCreate", this.onClientMessageCreate.bind(this));
		client.on("messageUpdate", this.onClientMessageUpdate.bind(this));
		// TODO: Do I need to track deletes for any reason?
		// messageDelete: [message: Message | PartialMessage];
		client.on("messageDelete", msg => setDeleted(msg.id as Snowflake));
		// messageDeleteBulk: [messages: Collection<Snowflake, Message | PartialMessage>];
		client.on("messageDeleteBulk", msgs => msgs.forEach(msg => setDeleted(msg.id as Snowflake)));

		client.on("messageReactionAdd", this.onClientMessageReactionAdd.bind(this));
		client.on("messageReactionRemove", this.onClientMessageReactionRemove.bind(this));
		// TODO: Do these call the above remove or do i need to handle all?
		// messageReactionRemoveAll: [message: Message | PartialMessage, reactions: Collection<string | Snowflake, MessageReaction>];
		// messageReactionRemoveEmoji: [reaction: MessageReaction | PartialMessageReaction];

		// TODO: Do I need to add/remove Sage in threads manually?
		// threadCreate: [thread: ThreadChannel];
		// threadDelete: [thread: ThreadChannel];
		// threadListSync: [threads: Collection<Snowflake, ThreadChannel>];
		// threadMemberUpdate: [oldMember: ThreadMember, newMember: ThreadMember];
		// threadMembersUpdate: [oldMembers: Collection<Snowflake, ThreadMember>, newMembers: Collection<Snowflake, ThreadMember>];
		// threadUpdate: [oldThread: ThreadChannel, newThread: ThreadChannel];

		// TODO: Do I wanna store a readable name?
		// userUpdate: [oldUser: User | PartialUser, newUser: User];

		// TODO: I create webhook(s) as needed, so likely not needed.
		// webhookUpdate: [channel: TextChannel | NewsChannel];

		client.login(this.token);
	}

	onInteractionCreate(interaction: Interaction): void {
		handleInteraction(interaction).then(data => {
			if (data.handled > 0 || data.tested > 0) {
				const commandName = interaction.isCommand() ? interaction.commandName : "";
				verbose(`Discord.Client.on("interactionCreate", "${interaction.id}", "${commandName}") => ${data.tested}.${data.handled}`);
			}
		});
	}

	onClientReady(client: Client): void {
		client.user?.setPresence({
			status: "online"
		});
		client.user?.setActivity("rpgsage.io; /sage-help", {
			type: ActivityType.Playing
		});

		SageCache.fromClient(client).then(sageCache => {
			this.sageCache = sageCache;
			ActiveBot.active = this;

			addLogHandler("error", (...args: any[]) => {
				ActiveBot.sendToSuperUser(...chunk(`# error\n${args.map(formatArg).join("\n")}`, 2000));
			});

			info(`Discord.Client.on("ready") [success]`);
			ActiveBot.sendToSuperUser(`Discord.Client.on("ready") [success]`);

		}, err => {
			error(`Discord.Client.on("ready") [error]`, err);
			process.exit(1);
		});
	}

	onClientGuildCreate(guild: Guild): void {
		this.sageCache.servers.initializeServer(guild).then(initialized => {
			verbose(`Discord.Client.on("guildCreate", "${guild.id}::${guild.name}") => ${initialized}`);
		});
	}

	// onClientGuildDelete(guild: Guild): void {
	// 	this.sageCache.servers.retireServer(guild).then(retired => {
	// 		verbose(`NOT IMPLEMENTED: Discord.Client.on("guildDelete", "${guild.id}::${guild.name}") => ${retired}`);
	// 	});
	// }

	// onClientGuildBanAdd(ban: GuildBan): void {
	// 	const user = ban.user;
	// 	if (isSageId(user.id)) {
	// 		const guild = ban.guild;
	// 		this.sageCache.servers.retireServer(guild, false, true).then(retired => {
	// 			verbose(`NOT IMPLEMENTED: Discord.Client.on("guildBanAdd", "${guild.id}::${guild.name}", "${user.id}::${user.username}") => ${retired}`);
	// 		});
	// 	}
	// }

	// onClientGuildBanRemove(ban: GuildBan): void {
	// 	const user = ban.user;
	// 	if (isSageId(user.id)) {
	// 		const guild = ban.guild;
	// 		//TODO: IMPLEMENT UNARCHIVE/UNRETIRE?
	// 		verbose(`NOT IMPLEMENTED: Discord.Client.on("guildBanRemove", "${guild.id}::${guild.name}", "${user.id}::${user.username}")`);
	// 	}
	// }

	// onClientGuildMemberUpdate(originalMember: GuildMember | PartialGuildMember, updatedMember: GuildMember): void {
	// 	handleGuildMemberUpdate(originalMember, updatedMember).then(updated => {
	// 		if (updated) {
	// 			verbose(`Discord.Client.on("guildMemberUpdate", "${originalMember.id}::${originalMember.displayName}", "${updatedMember.id}::${updatedMember.displayName}")`);
	// 		}
	// 	});
	// }

	// onClientGuildMemberRemove(member: GuildMember | PartialGuildMember): void {
	// 	if (isSageId(member.id)) {
	// 		this.sageCache.servers.retireServer(member.guild, true).then(retired => {
	// 			verbose(`NOT IMPLEMENTED: Discord.Client.on("guildMemberRemove", "${member.id}::${member.displayName}") => ${retired}`);
	// 		});
	// 	}
	// }

	onClientMessageCreate(message: Message): void {
		handleMessage(message, null, MessageType.Post).then(data => {
			if (data.handled > 0) {
				verbose(`Discord.Client.on("message", "${message.id}") => ${data.tested}.${data.handled}`);
			}
		});
	}

	onClientMessageUpdate(originalMessage: Message | PartialMessage, updatedMessage: Message | PartialMessage): void {
		handleMessage(updatedMessage, originalMessage, MessageType.Edit).then(data => {
			if (data.handled > 0) {
				verbose(`Discord.Client.on("messageUpdate", "${originalMessage.id}", "${updatedMessage.id}") => ${data.tested}.${data.handled}`);
			}
		});
	}

	onClientMessageReactionAdd(messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): void {
		handleReaction(messageReaction, user, ReactionType.Add).then(data => {
			if (data.handled > 0) {
				verbose(`Discord.Client.on("messageReactionAdd", "${messageReaction.message.id}::${messageReaction.emoji}", "${user.id}") => ${data.tested}.${data.handled}`);
			}
		});
	}

	onClientMessageReactionRemove(messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): void {
		handleReaction(messageReaction, user, ReactionType.Remove).then(data => {
			if (data.handled > 0) {
				verbose(`Discord.Client.on("messageReactionRemove", "${messageReaction.message.id}::${messageReaction.emoji}", "${user.id}") => ${data.tested}.${data.handled}`);
			}
		});
	}

	public static client: Client;

	public static from(bot: Bot): ActiveBot {
		return new ActiveBot(bot.toJSON());
	}

	public static async prepBot(): Promise<Bot> {
		const codeName = getCodeName();
		const contentFilter = (core: IBotCore) => core.codeName === codeName;
		const botsPath = `${getDataRoot("sage")}/bots`;
		const botCore = await findJsonFile(botsPath, { contentFilter });
		if (!botCore) throw new Error(`Cannot find bot: ${codeName}`);
		return new Bot(botCore!, null!);
	}

}

// async function handleGuildMemberUpdate(originalMember: GuildMember | PartialGuildMember, updatedMember: GuildMember): Promise<boolean>;
// async function handleGuildMemberUpdate(_: GuildMember | PartialGuildMember, __: GuildMember): Promise<boolean> {
// 	return true;
// }
