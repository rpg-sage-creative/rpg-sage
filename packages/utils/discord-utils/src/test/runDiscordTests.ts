import { captureProcessExit, getAssertData, info, runTests, type Awaitable } from "@rsc-utils/core-utils";
import { ActivityType, Client, IntentsBitField, type ClientOptions } from "discord.js";
import { readFileSync } from "fs";

type DiscordTestFn = (client: Client) => Awaitable<void>;

function getClientOptions(): ClientOptions {
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
	return { intents };
}

function getToken(): string {
	return readFileSync("./config/token.txt").toString("utf-8");
}

/** Creates and logs into a discordjs Client that is then passed to the given test function ... all wrapped in the runTests logic from core-utils. */
export async function runDiscordTests(testFn: DiscordTestFn, exitOnFail: boolean): Promise<void>;
export async function runDiscordTests(testFn: DiscordTestFn, token: string): Promise<void>;
export async function runDiscordTests(testFn: DiscordTestFn, exitOnFail: boolean, token: string): Promise<void>;
export async function runDiscordTests(testFn: DiscordTestFn, ...args: (boolean | string)[]): Promise<void> {
	const exitOnFail = args.includes(true);
	const token = args.find(arg => typeof(arg) === "string") as string;

	const client = new Client(getClientOptions());
	captureProcessExit(() => {
		info("Destroying Discord.Client");
		return client?.destroy();
	});
	client.once("ready", async () => {
		await runTests(async () => {
			client.user?.setPresence({ status:"online" });
			client.user?.setActivity("RPG Sage run tests ...", { type:ActivityType.Watching });
			info(`Discord.Client.on("ready") [success]`);

			await testFn(client);

			await client.destroy();
		}, false, client);
		if (exitOnFail && getAssertData()?.failed) {
			process.exit(1);
		}
	});
	client.login(token ?? getToken());
}