import { addLogHandler, captureProcessExit, error, formatArg, info, verbose, type LogLevel } from "@rsc-utils/console-utils";
import type { DMessage } from "@rsc-utils/discord-utils";
import type { Snowflake } from "@rsc-utils/snowflake-utils";
import { chunk } from "@rsc-utils/string-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { ClientOptions, Guild, GuildBan, GuildMember, Interaction, Message, MessageReaction, PartialGuildMember, PartialMessage, PartialMessageReaction, PartialUser, User } from "discord.js";
import { Client } from "discord.js";
import { MessageType, ReactionType } from "../../discord";
import { setDeleted } from "../../discord/deletedMessages";
import { handleInteraction, handleMessage, handleReaction, registeredIntents } from "../../discord/handlers";
import { BotRepo } from "../repo/BotRepo";
import type { IBotCore } from "./Bot";
import { Bot, TBotCodeName } from "./Bot";
import { SageCache } from "./SageCache";

interface IClientEventHandler {
	onClientReady(): void;
	onClientGuildCreate(guild: Guild): void;
	onClientGuildDelete(guild: Guild): void;
	onClientGuildBanAdd(ban: GuildBan): void;
	onClientGuildBanRemove(ban: GuildBan): void;
	onClientGuildMemberUpdate(member: GuildMember | PartialGuildMember, originalMember: GuildMember): void;
	onClientGuildMemberRemove(member: GuildMember | PartialGuildMember): void;
	onClientMessageCreate(message: Message): void;
	onClientMessageUpdate(originalMessage: Message | PartialMessage, message: Message | PartialMessage): void;
	onClientMessageReactionAdd(messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): void;
	onClientMessageReactionRemove(messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): void;
}

function createDiscordClientOptions(): ClientOptions {
	return { intents:registeredIntents() };
}

export class ActiveBot extends Bot implements IClientEventHandler {
	public static active: ActiveBot;
	public static get isDev(): boolean { return ActiveBot.active?.codeName === "dev"; }
	public static isActiveBot(userDid: Optional<Snowflake>): boolean {
		return ActiveBot.active?.did === userDid;
	}

	public client: Client;

	private constructor(core: IBotCore) {
		super(core, null!);

		this.client = new Client(createDiscordClientOptions());
		captureProcessExit(() => {
			info("Destroying Discord.Client");
			this.client.destroy();
		});

		// To see options, look for: Discord.ClientEvents (right click nav .on below)
		this.client.once("ready", this.onClientReady.bind(this));

		// TODO: if created in a game category i could add or prompt to add?
		// channelCreate: [channel: GuildChannel];
		// TODO: i should remove this from any game or server object ...
		// channelDelete: [channel: DMChannel | GuildChannel];
		// TODO: needed?
		// channelPinsUpdate: [channel: TextBasedChannels, date: Date];
		// channelUpdate: [oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel];

		this.client.on("guildCreate", this.onClientGuildCreate.bind(this));
		this.client.on("guildDelete", this.onClientGuildDelete.bind(this));
		// TODO: What is unavailable?
		// guildUnavailable: [guild: Guild];
		// Use this to update server name?
		// guildUpdate: [oldGuild: Guild, newGuild: Guild];

		this.client.on("guildBanAdd", this.onClientGuildBanAdd.bind(this));
		this.client.on("guildBanRemove", this.onClientGuildBanRemove.bind(this));

		this.client.on("guildMemberUpdate", this.onClientGuildMemberUpdate.bind(this));
		this.client.on("guildMemberRemove", this.onClientGuildMemberRemove.bind(this));

		this.client.on("interactionCreate", this.onInteractionCreate.bind(this));

		this.client.on("messageCreate", this.onClientMessageCreate.bind(this));
		this.client.on("messageUpdate", this.onClientMessageUpdate.bind(this));
		// TODO: Do I need to track deletes for any reason?
		// messageDelete: [message: Message | PartialMessage];
		this.client.on("messageDelete", msg => setDeleted(msg.id));
		// messageDeleteBulk: [messages: Collection<Snowflake, Message | PartialMessage>];
		this.client.on("messageDeleteBulk", msgs => msgs.forEach(msg => setDeleted(msg.id)));

		this.client.on("messageReactionAdd", this.onClientMessageReactionAdd.bind(this));
		this.client.on("messageReactionRemove", this.onClientMessageReactionRemove.bind(this));
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

		this.client.login(this.token);
	}

	onInteractionCreate(interaction: Interaction): void {
		handleInteraction(interaction).then(data => {
			if (data.handled > 0 || data.tested > 0) {
				const commandName = interaction.isCommand() ? interaction.commandName : "";
				verbose(`Discord.Client.on("interactionCreate", "${interaction.id}", "${commandName}") => ${data.tested}.${data.handled}`);
			}
		});
	}

	onClientReady(): void {
		this.client.user?.setPresence({
			status: "online"
		});
		this.client.user?.setActivity("rpgsage.io; /sage help", {
			type: "PLAYING"
		});

		SageCache.fromClient(this.client).then(sageCache => {
			this.sageCache = sageCache;
			ActiveBot.active = this;

			addLogHandler("error", consoleHandler.bind(this));

			info(`Discord.Client.on("ready") [success]`);
			// Notify super user of successful start.
			this.sageCache.discord.fetchUser("253330271678627841").then(user => user?.send(`Discord.Client.on("ready") [success]`));
		}, err => {
			error(`Discord.Client.on("ready") [error]`, err);
			process.exit(1);
		});

		async function consoleHandler(this: ActiveBot, logLevel: LogLevel, ...args: any[]): Promise<void> {
			this.devs.forEach(dev => {
				const contents = `# ${logLevel}\n${args.map(formatArg).join("\n")}`;
				const chunks = chunk(contents, 2000);
				this.sageCache.discord.fetchUser(dev.did)
					.then(user => user ? chunks.forEach(chunk => user.send(chunk)) : void 0);
			});
		}
	}

	onClientGuildCreate(guild: Guild): void {
		this.sageCache.servers.initializeServer(guild).then(initialized => {
			verbose(`Discord.Client.on("guildCreate", "${guild.id}::${guild.name}") => ${initialized}`);
		});
	}

	onClientGuildDelete(guild: Guild): void {
		this.sageCache.servers.retireServer(guild).then(retired => {
			verbose(`NOT IMPLEMENTED: Discord.Client.on("guildDelete", "${guild.id}::${guild.name}") => ${retired}`);
		});
	}

	onClientGuildBanAdd(ban: GuildBan): void {
		const user = ban.user;
		if (ActiveBot.isActiveBot(user.id)) {
			const guild = ban.guild;
			this.sageCache.servers.retireServer(guild, false, true).then(retired => {
				verbose(`NOT IMPLEMENTED: Discord.Client.on("guildBanAdd", "${guild.id}::${guild.name}", "${user.id}::${user.username}") => ${retired}`);
			});
		}
	}

	onClientGuildBanRemove(ban: GuildBan): void {
		const user = ban.user;
		if (ActiveBot.isActiveBot(user.id)) {
			const guild = ban.guild;
			//TODO: IMPLEMENT UNARCHIVE/UNRETIRE?
			verbose(`NOT IMPLEMENTED: Discord.Client.on("guildBanRemove", "${guild.id}::${guild.name}", "${user.id}::${user.username}")`);
		}
	}

	onClientGuildMemberUpdate(originalMember: GuildMember | PartialGuildMember, updatedMember: GuildMember): void {
		handleGuildMemberUpdate(originalMember, updatedMember).then(updated => {
			if (updated) {
				verbose(`Discord.Client.on("guildMemberUpdate", "${originalMember.id}::${originalMember.displayName}", "${updatedMember.id}::${updatedMember.displayName}")`);
			}
		});
	}

	onClientGuildMemberRemove(member: GuildMember | PartialGuildMember): void {
		if (ActiveBot.isActiveBot(member.id)) {
			this.sageCache.servers.retireServer(member.guild, true).then(retired => {
				verbose(`NOT IMPLEMENTED: Discord.Client.on("guildMemberRemove", "${member.id}::${member.displayName}") => ${retired}`);
			});
		}
	}

	onClientMessageCreate(message: Message): void {
		handleMessage(message as DMessage, null, MessageType.Post).then(data => {
			if (data.handled > 0) {
				verbose(`Discord.Client.on("message", "${message.id}") => ${data.tested}.${data.handled}`);
			}
		});
	}

	onClientMessageUpdate(originalMessage: Message | PartialMessage, updatedMessage: Message | PartialMessage): void {
		handleMessage(updatedMessage as DMessage, originalMessage as DMessage, MessageType.Edit).then(data => {
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

	public static async activate(codeName: TBotCodeName): Promise<void> {
		const bot = await BotRepo.getByCodeName(codeName);
		if (bot) {
			ActiveBot.from(bot);
		}else {
			error(`Failure to load: ${codeName}`);
		}
	}

	public static from(bot: Bot): ActiveBot {
		return new ActiveBot(bot.toJSON());
	}

}

async function handleGuildMemberUpdate(originalMember: GuildMember | PartialGuildMember, updatedMember: GuildMember): Promise<boolean>;
async function handleGuildMemberUpdate(_: GuildMember | PartialGuildMember, __: GuildMember): Promise<boolean> {
	return true;
}
