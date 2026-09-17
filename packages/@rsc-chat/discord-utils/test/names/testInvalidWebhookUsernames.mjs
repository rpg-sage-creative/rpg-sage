import { captureProcessExit, toLiteral } from "@rsc-utils/core-utils";
import { Client, IntentsBitField } from "discord.js";
import { readFileSync } from "fs";
import { DiscordCache } from "../../build/index.js";

/*
This file is for confirming our own curated list of known invalid webhook usernames.
We don't want this running as part of standard tests, so we have it as a .mjs instead of a .jest.js

node ./test/names/testInvalidWebhookUsernames.mjs
*/

// snowflakes for things we use to test DiscordCache
const ids = JSON.parse(readFileSync("./config/ids.json").toString("utf-8"));

DiscordCache.setSageId(ids.SAGE_ID);

// the intents flags for connecting to Discord
const intents = [
	IntentsBitField.Flags.Guilds,
	IntentsBitField.Flags.GuildMembers,
	IntentsBitField.Flags.GuildModeration,
	// IntentsBitField.Flags.GuildBans <-- deprecated
	IntentsBitField.Flags.GuildEmojisAndStickers,
	// IntentsBitField.Flags.GuildIntegrations
	IntentsBitField.Flags.GuildWebhooks,
	IntentsBitField.Flags.GuildInvites,
	// IntentsBitField.Flags.GuildVoiceStates,
	IntentsBitField.Flags.GuildPresences,
	IntentsBitField.Flags.GuildMessages,
	IntentsBitField.Flags.GuildMessageReactions,
	// IntentsBitField.Flags.GuildMessageTyping,
	IntentsBitField.Flags.DirectMessages,
	IntentsBitField.Flags.DirectMessageReactions,
	// IntentsBitField.Flags.DirectMessageTyping,
	IntentsBitField.Flags.MessageContent,
	IntentsBitField.Flags.GuildScheduledEvents,
	// IntentsBitField.Flags.AutoModerationConfiguration,
	// IntentsBitField.Flags.AutoModerationExecution,
	IntentsBitField.Flags.GuildMessagePolls,
	IntentsBitField.Flags.DirectMessagePolls,
];

async function main() {

	/** @type {Client} */
	let client;

	captureProcessExit(() => client?.destroy());

	await new Promise((resolve, reject) => {
		const token = readFileSync("./config/token.txt").toString("utf-8");
		client = new Client({ intents });
		client.once("ready", c => {
			console.log("ready");
			resolve();
		});
		client.login(token).catch(ex => {
			console.error(ex);
			client?.destroy();
			reject();
		});
	});

	if (client) {
		const invalidNames = [
			{ name:"everyone" },
			{ name:"here" },

			{ name:"discord",  variants:true },
			{ name:"clyde"     },
			{ name:"wumpus",   },

			{ name:"```" },
		];
		const variantPairs = [
			["e", "3"],
			["e", "ë"],
			["s", "5"],
		];
		const tests = [];
		invalidNames.forEach(({ name, anchored, variants }) => {
			variantPairs.forEach(variantPair => {
				const variant = name.replace(variantPair[0], variantPair[1]);
				tests.push({ username:name, content:`testing ${toLiteral(name)}`, throws:true });
				tests.push({ username:`unanchored ${name}`, content:`testing ${toLiteral(`unanchored ${name}`)}`, throws:!anchored });
				if (variant !== name) {
					tests.push({ username:variant, content:`testing ${toLiteral(variant)}`, throws:variants });
					tests.push({ username:`unanchored ${variant}`, content:`testing ${toLiteral(`unanchored ${variant}`)}`, throws:!anchored&&variants });
				}
			});
		});
		console.log(`${tests.length} tests ...`);

		const discordCache = await DiscordCache.from(client, ids.GUILD_ID);
		const webhook = await discordCache.fetchWebhook({ channelId:ids.CHANNEL_ID, guildId:ids.GUILD_ID });

		for (const { content, throws, username } of tests) {
			console.log(`Testing: ${toLiteral(username)} ...`);
			let err;
			await webhook.send({ content, username }).catch(ex => { err = ex; });
			if (!!err !== !!throws) {
				console.warn(`We got one wrong: ${toLiteral(username)}`);
			}
		}
		console.log(`Done.`);
	}

	await client?.destroy();

}
await main();