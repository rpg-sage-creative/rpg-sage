import { info, type Optional } from "@rsc-utils/core-utils";
import type { Guild } from "discord.js";
import { ActiveBot } from "../../model/ActiveBot.js";
import { Server } from "../../model/Server.js";
import { globalCacheGet, globalCachePut } from "./globalCache.js";

export async function initializeServer(guild: Optional<Guild>): Promise<boolean> {
	if (!guild) {
		return false;
	}

	const existingServer = globalCacheGet("servers", guild.id);
	if (existingServer) {
		info(`${ActiveBot.active.codeName} rejoined ${guild?.name} (${guild?.id}) as ${existingServer.id}`);
		return false;
	}

	const serverCore = Server.createCore(guild);
	const saved = await globalCachePut(serverCore);
	if (saved) {
		info(`${ActiveBot.active.codeName} joined ${guild.name} (${guild.id}) as ${serverCore.id}`);
	}
	return saved;
}