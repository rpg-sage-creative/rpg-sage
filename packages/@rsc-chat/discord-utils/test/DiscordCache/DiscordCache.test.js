import { captureProcessExit, toLiteral } from "@rsc-utils/core-utils";
import { Client } from "discord.js";
import { DiscordCache, toChannelUrl, toHumanReadable, toMessageUrl, toUserUrl } from "../../build/index.js";
import { inject } from "vitest";

/** @type {Client} */
let client;

/** @type {DiscordCache} */
let discordCache;

const injected = {
	ids: inject("ids"),
	intents: inject("intents"),
	token: inject("token"),
};

beforeAll(async () => {
	captureProcessExit(() => client?.destroy());
	await new Promise((resolve, reject) => {
		client = new Client({ intents:injected.intents });
		client.once("clientReady", async () => resolve(client));
		client.login(injected.token).catch(reject);
	});
	discordCache = await DiscordCache.from(client, injected.ids.GUILD_ID);
});

afterAll(async () => client?.destroy());

describe("DiscordCache", () => {

	const { SAGE_ID, GUILD_ID } = injected.ids;

	test(`setSageId(${toLiteral(SAGE_ID)})`, () => {
		DiscordCache.setSageId(SAGE_ID);
		expect(DiscordCache.getSageId()).toBe(SAGE_ID);
	});


	test(`discordCache = await DiscordCache.from(client, ${toLiteral(GUILD_ID)})`, () => {
		expect(discordCache).toBeDefined();
		expect(discordCache.guild.id).toBe(GUILD_ID);
	});

});

describe("humanReadable", () => {
	describe("toHumanReadable", () => {

		const { CHANNEL_ID, GUILD_ID, ROLE_ID, SUPER_USER_ID, WEBHOOK_ID } = injected.ids;

		test(`toHumanReadable(channel)`, async () => {
			const channel = await discordCache.fetchChannel({ channelId:CHANNEL_ID, guildId:GUILD_ID });
			expect(toHumanReadable(channel)).toBe("RPG Sage (Dev)#​pf2e-ic");
		});

		test(`toHumanReadable(guild)`, async () => {
			const guild = await discordCache.fetchGuild(GUILD_ID);
			expect(toHumanReadable(guild)).toBe("RPG Sage (Dev)");
		});

		test(`toHumanReadable(user)`, async () => {
			const user = await discordCache.fetchUser(SUPER_USER_ID);
			expect(toHumanReadable(user)).toBe("@​Randal");
		});

		test(`toHumanReadable(guildMember)`, async () => {
			const guildMember = await discordCache.fetchGuildMember({ user:{id:SUPER_USER_ID}, guildId:GUILD_ID });
			expect(toHumanReadable(guildMember)).toBe("@​Randal");
		});

		test(`toHumanReadable(role)`, async () => {
			const role = await discordCache.fetchGuildRole(ROLE_ID);
			expect(toHumanReadable(role)).toBe("RPG Sage (Dev)@​Developer");
		});

		test(`toHumanReadable(webhook)`, async () => {
			const webhook = await discordCache.fetchWebhook({ channelId:CHANNEL_ID, guildId:GUILD_ID });
			expect(toHumanReadable(webhook)).toBe("@​RPG Sage (Dev)$SageDialogWebhookName");
			expect(webhook.id).toBe(WEBHOOK_ID);
		});

	});
});

describe("url", () => {

	describe(`toChannelUrl`, () => {

		const { GUILD_ID, CHANNEL_ID, MESSAGE_ID } = injected.ids;

		const CHANNEL_LINK = `https://discord.com/channels/${GUILD_ID}/${CHANNEL_ID}`;

		/** @type {import("discord.js").GuildTextBasedChannel} */
		let channel;

		test(`fetching channel to test: ${toLiteral({ channelId:CHANNEL_ID, guildId:GUILD_ID })}`, async () => {
			channel = await discordCache.fetchChannel({ channelId:CHANNEL_ID, guildId:GUILD_ID });
			expect(channel).toBeDefined();
		});

		test(`toChannelUrl(channel) === channel.url === ${toLiteral(CHANNEL_LINK)}`, async () => {
			expect(toChannelUrl(channel)).toBe(channel?.url);
			expect(toChannelUrl(channel)).toBe(CHANNEL_LINK);
		});

		/** @type {import("discord.js").Message} */
		let message;

		test(`fetching message to test: ${toLiteral({ channelId:CHANNEL_ID, guildId:GUILD_ID, message:MESSAGE_ID })}`, async () => {
			message = await channel?.messages.fetch({ message:MESSAGE_ID, cache:true, force:true });
			expect(message).toBeDefined();
		});

		test(`toChannelUrl(message) === message.channel.url === ${toLiteral(CHANNEL_LINK)}`, async () => {
			expect(toChannelUrl(message)).toBe(message?.channel?.url);
			expect(toChannelUrl(message)).toBe(CHANNEL_LINK);
		});

	});

	describe(`toMessageUrl`, () => {

		const { GUILD_ID, CHANNEL_ID, MESSAGE_ID } = injected.ids;

		const MESSAGE_LINK = `https://discord.com/channels/${GUILD_ID}/${CHANNEL_ID}/${MESSAGE_ID}`;

		/** @type {import("discord.js").GuildTextBasedChannel} */
		let channel;

		test(`fetching channel to test: ${toLiteral({ channelId:CHANNEL_ID, guildId:GUILD_ID })}`, async () => {
			channel = await discordCache.fetchChannel({ channelId:CHANNEL_ID, guildId:GUILD_ID });
			expect(channel).toBeDefined();
		});

		/** @type {import("discord.js").Message} */
		let message;

		test(`fetching message to test: ${toLiteral({ channelId:CHANNEL_ID, guildId:GUILD_ID, message:MESSAGE_ID })}`, async () => {
			message = await channel?.messages.fetch({ message:MESSAGE_ID, cache:true, force:true });
			expect(message).toBeDefined();
		});

		test(`toMessageUrl(message) === message.url === ${toLiteral(MESSAGE_LINK)}`, async () => {
			expect(toMessageUrl(message)).toBe(message?.url);
			expect(toMessageUrl(message)).toBe(MESSAGE_LINK);
		});

	});

	describe(`toUserUrl`, () => {

		const { SUPER_USER_ID } = injected.ids;

		const SUPER_USER_LINK = `https://discordapp.com/users/${SUPER_USER_ID}`;

		/** @type {import("discord.js").User} */
		let user;

		test(`fetching user to test: ${toLiteral(SUPER_USER_ID)}`, async () => {
			user = await discordCache.fetchUser(SUPER_USER_ID);
			expect(user).toBeDefined();
		});

		test(`toUserUrl(user) === ${toLiteral(SUPER_USER_LINK)}`, async () => {
			expect(toUserUrl(user)).toBe(SUPER_USER_LINK);
		});

	});

});