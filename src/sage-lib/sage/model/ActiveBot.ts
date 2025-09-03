import { addLogHandler, captureProcessExit, chunk, formatArg, getCodeName, info, verbose, warn, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, DiscordMaxValues, getRegisteredIntents, getRegisteredPartials, getSageId, getSuperUserId, getToken, wrapUrl } from "@rsc-utils/discord-utils";
import { ActivityType, Client, type ClientOptions, type Guild, type Interaction, type Message, type MessageReaction, type PartialMessage, type PartialMessageReaction, type PartialUser, type User } from "discord.js";
import { notifyOfError } from "../../../sage-utils/notifyOfError.js";
import { setDeleted } from "../../discord/deletedMessages.js";
import { handleInteraction, handleMessage, handleReaction } from "../../discord/handlers.js";
import { MessageType, ReactionType } from "../../discord/index.js";
import { initializeServer } from "../repo/base/initializeServer.js";
import { Bot, type BotCore } from "./Bot.js";

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
	public static sns = true;
	public static active: ActiveBot;
	public static get isDev(): boolean { return ActiveBot.active?.codeName === "dev"; }

	public static async notifyOfError(...args: unknown[]): Promise<void> {
		if (ActiveBot.sns) {
			const notifySubject = `RPG Sage Error - ${getCodeName()}`;
			const contentToSend = args.map(formatArg).join("\n");
			const notifyResults = await notifyOfError(notifySubject, contentToSend);
			if (notifyResults) return;

			ActiveBot.sns = false;
		}
		ActiveBot.sendToSuperUser(`# error`, ...args);
	}

	public static async sendToSuperUser(...args: unknown[]): Promise<void> {
		const user = await ActiveBot.client.users.fetch(getSuperUserId(), { cache:true, force:false }).catch(DiscordApiError.process);
		if (user) {
			const maxLength = DiscordMaxValues.message.contentLength;
			const formattedContent = wrapUrl(args.map(formatArg).join("\n"), true);
			const chunks = chunk(formattedContent, maxLength);
			for (const chunk of chunks) {
				if (chunk.length && chunk.length < maxLength) {
					await user.send(chunk);
				}else {
					warn(`invalid chunk length for discord (${chunk.length}): ${chunk}`);
				}
			}
		}
	}

	// public client: Client;

	private constructor(core: BotCore) {
		super(core);

		const client = new Client(createDiscordClientOptions());

		ActiveBot.client = client;

		captureProcessExit(() => {
			info("Destroying Discord.Client");
			return ActiveBot.client.destroy();
		});

		// To see options, look for: Discord.ClientEvents (right click nav .on below)
		client.once("clientReady", this.onClientReady.bind(this));

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

		client.login(getToken());
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

		ActiveBot.active = this;

		addLogHandler("error", ActiveBot.notifyOfError);

		info(`Discord.Client.on("clientReady") [success]`);
		ActiveBot.sendToSuperUser(`Discord.Client.on("clientReady") [success]`);
	}

	onClientGuildCreate(guild: Guild): void {
		initializeServer(guild).then(initialized => {
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

	public static load(bot: Bot): ActiveBot {
		return new ActiveBot(bot.toJSON());
	}

	public static async prepBot(): Promise<Bot> {
		const id = getSageId();
		const bot = await Bot.readOrCreate(id);
		if (!bot) throw new Error(`Cannot find or create bot: ${id}`);
		return bot;
	}

}

// async function handleGuildMemberUpdate(originalMember: GuildMember | PartialGuildMember, updatedMember: GuildMember): Promise<boolean>;
// async function handleGuildMemberUpdate(_: GuildMember | PartialGuildMember, __: GuildMember): Promise<boolean> {
// 	return true;
// }
