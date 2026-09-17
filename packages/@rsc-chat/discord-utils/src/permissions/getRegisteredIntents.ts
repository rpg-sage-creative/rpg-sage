import { GatewayIntentBits } from "discord.js";

export function getRegisteredIntents(): GatewayIntentBits[] {
	// const registered: IntentsString[] = [];
	// messageListeners.forEach(listener => registered.push(...listener.intents ?? []));
	// reactionListeners.forEach(listener => registered.push(...listener.intents ?? []));

	return [
		// GatewayIntentBits.AutoModerationConfiguration,
		// GatewayIntentBits.AutoModerationExecution,
		// GatewayIntentBits.DirectMessagePolls,
		GatewayIntentBits.DirectMessageReactions,
		// GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.DirectMessages,
		// GatewayIntentBits.GuildExpressions,
		// GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessagePolls,
		GatewayIntentBits.GuildMessageReactions,
		// GatewayIntentBits.GuildMessageTyping,
		GatewayIntentBits.GuildMessages,
		// GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildPresences,
		// GatewayIntentBits.GuildScheduledEvents,
		// GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
	];
}