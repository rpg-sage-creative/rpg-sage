import { getHomeServerId, getToken } from "@rsc-sage/env";
import { captureProcessExit, debug, errorReturnUndefined, isNonNilSnowflake, parseJson, stringifyJson, toMarkdown, type Snowflake } from "@rsc-utils/core-utils";
import { getRegisteredIntents, toUserMention } from "@rsc-utils/discord-utils";
import { AppServer, type BufferHandlerJsonError, type BufferHandlerResponse } from "@rsc-utils/io-utils";
import { AttachmentBuilder, Client } from "discord.js";
import { parseDiceMatches } from "../../../sage-lib/sage/commands/dice.js";
import { StatMacroProcessor } from "../../../sage-lib/sage/commands/dice/stats/StatMacroProcessor.js";
import { GameCharacter } from "../../../sage-lib/sage/model/GameCharacter.js";

/*
	Assuming a valid payload:
		1. find user id
		2. load user info
		3. find last character post
		4. find last die roll
		5. figure out which should be the target channel
		6. connect and post dice roll

	Optionally:
		- allow characterId and channelId in payload
		- have a dice command that queues up rolls waiting for pixels dice
*/

type PixelsDicePayload = {
	/** UTC */
	timestamp: string;
	/** x.y.z */
	appVersion: string;
	/** number */
	appBuild: string;
	/** */
	profileName: string;
	/** Value field in the Web Request setup in the Pixels App */
	actionValue: string;
	/** */
	pixelName: string;
	/** */
	pixelId: number;
	/** */
	faceValue: number;
	/** */
	faceIndex: number;
	/** */
	ledCount: number;
	/** */
	colorway: string;
	/** d20 */
	dieType: string;
	/** */
	firmwareTimestamp: string;
	/** */
	rssi: number;
	/** 0-1 as percent */
	batteryLevel: number;
	/** */
	isCharging: boolean;
	/** "rolled" */
	rollState: string;
};

type RelayServerResponse = {

};

const ActionKeys = ["channelId", "characterId", "guildId", "serverId", "userId"] as const;
type ActionKey = typeof ActionKeys[number];
function isActionKey(value: string): value is ActionKey {
	return ActionKeys.includes(value as ActionKey);
}

const ActionValueSplitterRegExp = /[;&]/;

let _client: Client | undefined;
async function startClient() {
	captureProcessExit(destroyClient);
	await new Promise((resolve, reject) => {
		_client = new Client({ intents:getRegisteredIntents() });
		_client.once("ready", async () => resolve(_client));
		_client.login(getToken()).catch(reject);
	});
}
function destroyClient() {
	_client?.destroy();
}

async function serverHandler(bufferOrPayload: Buffer | PixelsDicePayload): Promise<BufferHandlerResponse<RelayServerResponse | BufferHandlerJsonError>> {

	const payload = Buffer.isBuffer(bufferOrPayload) ? parseJson(bufferOrPayload.toString()) as PixelsDicePayload : bufferOrPayload;

	debug({payload});

	const action = payload?.actionValue?.split(ActionValueSplitterRegExp).reduce((out, pair) => {
		const [key, value] = pair.split("=").map(s => s.trim());
		if (isActionKey(key) && isNonNilSnowflake(value)) {
			out[key] = value;
		}
		return out;
	}, {} as Record<ActionKey, Snowflake>);

	debug({action});

	if (action.channelId && action.userId) {

		// const discordCache = await DiscordCache.from(client!, getHomeServerId());

		const guildId = action.guildId ?? action.serverId ?? getHomeServerId();
		const guild = await _client?.guilds.fetch(guildId);
		const channel = await guild?.channels.fetch(action.channelId);
		if (channel?.isSendable()) {
			const diceString = `[(${payload.faceValue})${payload.dieType} \`${payload.pixelName}: ${payload.profileName}\`]`;
			const processor = StatMacroProcessor.for(new GameCharacter({id:"1",name:""})) as StatMacroProcessor;
			const sageCommand = { isSageReaction:()=>false, getTieredMacros:()=>[], sageUser:{macros:[]} } as any;
			const diceMatches = await parseDiceMatches(diceString, { processor, sageCommand });
			const diceOutput = diceMatches.map(dice => dice.output).flat();
			const formattedDice = diceOutput.map(dice => toMarkdown(dice.output));
			const content = `${toUserMention(action.userId)} rolled some Pixels dice ...\n${formattedDice}`;

			const buffer = Buffer.from(stringifyJson(payload), "utf-8");
			const options = { name:`PixelsDicePayload.json` };
			const attachment = new AttachmentBuilder(buffer, options);
			const files = [attachment];
			files.length = 0;

			const message = await channel.send({ content, files }).catch(errorReturnUndefined);
			if (message) {
				return {
					statusCode: 200,
					contentType: "application/json",
					body: { success:true },
				};
			}
		}

	}

	return {
		statusCode: 500,
		contentType: "application/json",
		body: { error:"Error relaying pixels roll!" },
	};
}

export class PixelsRelayServer {
	public static startServer(port: number): AppServer<RelayServerResponse> {
		const handlers = {
			bufferHandler: serverHandler,
			destroyHandler: destroyClient,
			startHandler: startClient,
		};
		return AppServer.start("Pixels", port, handlers);
	}
}