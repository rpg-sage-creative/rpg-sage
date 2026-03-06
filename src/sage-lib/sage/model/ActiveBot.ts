import { getSageId, getSnsClientConfig, getSuperUserId, getToken } from "@rsc-sage/env";
import { addLogHandler, captureProcessExit, chunk, formatArg, getCodeName, info, tagLiterals, verbose, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, getRegisteredIntents, getRegisteredPartials, wrapUrls } from "@rsc-utils/discord-utils";
import { sendSns } from "@rsc-utils/io-utils";
import { ActivityType, Client, type ClientOptions } from "discord.js";
import { setDeleted } from "../../discord/deletedMessages.js";
import { handleInteraction, handleMessage, handleReaction } from "../../discord/handlers.js";
import { initializeServer } from "../repo/base/initializeServer.js";
import { Bot, type BotCore } from "./Bot.js";
import { createClientEventLabel } from "./utils/createClientEventLabel.js";

function createDiscordClientOptions(): ClientOptions {
	return {
		intents: getRegisteredIntents(),
		partials: getRegisteredPartials()
	};
}

/** Attempts to send the errors/args via SNS before falling back to sendToSuperUser (Discord DM). */
async function notifyViaSns(...args: unknown[]): Promise<void> {
	// check the sns flag
	if (ActiveBot.sns) {
		const clientConfig = getSnsClientConfig();
		if (clientConfig) {
			// prep content
			const subject = `RPG Sage Error - ${getCodeName()}`;
			const content = args.map(formatArg).join("\n");

			// attemp to notify via sns
			const notifyResults = await sendSns({ clientConfig, content, subject }).catch(ex => {
				notifyViaDm("SNS Error", ex);
				return false;
			});

			// a successful sns means we are done
			if (notifyResults) return;
		}

		// a single failure stops sending to sns to avoid a cascade of failures
		ActiveBot.sns = false;
	}

	// fallback to discord dm
	notifyViaDm(`# error`, ...args);
}

/** Tries to send errors/args to the super user as a Discord DM. */
async function notifyViaDm(...args: unknown[]): Promise<void> {
	const user = await ActiveBot.client.users.fetch(getSuperUserId(), { cache:true, force:false }).catch(DiscordApiError.process);
	if (user) {
		// discord messages have limits, chunk the content to be safe
		const formatted = args.map(formatArg);
		const joined = formatted.join("\n");
		const wrapped = wrapUrls(joined);
		const contents = chunk(wrapped, { maxChunkLength:2000 });
		for (const content of contents) {
			await user.send(content);
		}
	}
}

export class ActiveBot extends Bot {
	public static active: ActiveBot;

	/** are we trying to send to sns? starts as true */
	public static sns = true;

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
		client.once("clientReady", client => {
			client.user?.setPresence({
				status: "online"
			});
			client.user?.setActivity("rpgsage.io; /sage-help", {
				type: ActivityType.Playing
			});

			ActiveBot.active = this;

			addLogHandler("error", notifyViaSns);

			info(`Discord.Client.on("clientReady") [success]`);
			notifyViaDm(`Discord.Client.on("clientReady") [success]`);
		});

		// TODO: if created in a game category i could add or prompt to add?
		// channelCreate: [channel: GuildChannel];
		// TODO: i should remove this from any game or server object ...
		// channelDelete: [channel: DMChannel | GuildChannel];
		// TODO: needed?
		// channelPinsUpdate: [channel: TextBasedChannels, date: Date];
		// channelUpdate: [oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel];

		client.on("guildCreate", guild => {
			initializeServer(guild).then(initialized => {
				const guildArg = { id:guild.id, name:guild.name };
				verbose(tagLiterals`Discord.Client.on("guildCreate", ${guildArg}) => ${initialized}`);
			});
		});

		// client.on("guildDelete", this.onClientGuildDelete.bind(this));
		// TODO: What is unavailable?
		// guildUnavailable: [guild: Guild];
		// Use this to update server name?
		// guildUpdate: [oldGuild: Guild, newGuild: Guild];

		// client.on("guildBanAdd", this.onClientGuildBanAdd.bind(this));
		// client.on("guildBanRemove", this.onClientGuildBanRemove.bind(this));

		// client.on("guildMemberUpdate", this.onClientGuildMemberUpdate.bind(this));
		// client.on("guildMemberRemove", this.onClientGuildMemberRemove.bind(this));

		const interactionEvents = ["interactionCreate"] as const;
		for (const ev of interactionEvents) {
			client.on(ev, interaction => {
				handleInteraction(ev, interaction).then(data => {
					if (data.handled > 0 || data.tested > 0) {
						const clientEvent = createClientEventLabel(ev, interaction);
						const interactionArg = "message" in interaction
							? { id:interaction.id, message:{ id:interaction.message?.id }, user:{ id:interaction.user.id } }
							: { id:interaction.id, user:{ id:interaction.user.id } };
						verbose(tagLiterals`Discord.Client.on(${clientEvent}, interaction:${interactionArg}) => ${data.tested}.${data.handled}`);
					}
				});
			});
		}

		const messageEvents = ["messageCreate", "messageUpdate"] as const;
		for (const ev of messageEvents) {
			client.on(ev, (originalMessage, updatedMessage?) => {
				handleMessage(ev, originalMessage, updatedMessage).then(data => {
					if (data.handled > 0) {
						const originalMessageArg = { id:originalMessage.id, author:{ id:originalMessage.author?.id } };
						const updatedMessageArg = { id:updatedMessage?.id, author:{ id:updatedMessage?.author?.id } };
						verbose(tagLiterals`Discord.Client.on(${ev}, originalMessage:${originalMessageArg}, updatedMessage:${updatedMessageArg}) => ${data.tested}.${data.handled}`);
					}
				});
			});
		}

		/*
			by tracking deleted messages (even only for a couple seconds) we can try:
			1. delete any resources tied to that message (OG maps and char sheets not linked elsewhere)
			2. avoid processing dialog processed and deleted by tupper
		*/
		client.on("messageDelete", message => setDeleted(message.id as Snowflake));
		client.on("messageDeleteBulk", messages => messages.forEach(message => setDeleted(message.id as Snowflake)));

		const reactionEvents = ["messageReactionAdd", "messageReactionRemove"] as const;
		for (const ev of reactionEvents) {
			client.on(ev, (messageReaction, user, _details) => {
				handleReaction(ev, messageReaction, user).then(data => {
					if (data.handled > 0) {
						const messageReactionArg = { message:{ id:messageReaction.message.id }, emoji:{ name:messageReaction.emoji.name } };
						const userArg = { id:user.id };
						verbose(tagLiterals`Discord.Client.on(${ev}, messageReaction:${messageReactionArg}, user:${userArg}) => ${data.tested}.${data.handled}`);
					}
				});
			});
		}

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
