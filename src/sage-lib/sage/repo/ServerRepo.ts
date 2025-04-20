import { getHomeServerId } from "@rsc-sage/env";
import { info, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { Guild } from "discord.js";
import type { SageCache } from "../model/SageCache.js";
import { Server, type ServerCore } from "../model/Server.js";
import { DidRepository } from "./base/DidRepository.js";

export class ServerRepo extends DidRepository<ServerCore, Server> {

	public async getHome(): Promise<Server> {
		return this.getByDid(getHomeServerId()) as Promise<Server>;
	}

	/** This finds or creates the server object. It also updates the server name if changed. */
	public async getOrCreateByGuild(guild: Guild): Promise<Server> {
		let server = await this.getByDid(guild.id as Snowflake);
		if (!server) {
			server = new Server(Server.createCore(guild), this.sageCache);
		}
		if (server.name !== guild.name) {
			server.toJSON().name = guild.name;
			await server.save();
		}
		return server;
	}

	public async initializeServer(guild: Optional<Guild>): Promise<boolean> {
		if (!guild) {
			return false;
		}

		const existingServer = await this.getByDid(guild.id as Snowflake);
		if (existingServer) {
			guild = existingServer.discord.guild;
			info(`${this.sageCache.bot.codeName} rejoined ${guild?.name} (${guild?.id}) as ${existingServer.id}`);
			return false;
		}

		const server = new Server(Server.createCore(guild), this.sageCache),
			saved = await this.write(server);
		if (saved) {
			info(`${this.sageCache.bot.codeName} joined ${guild.name} (${guild.id}) as ${server.id}`);
		}
		return saved;
	}

	// public async retireServer(guild: Guild, kicked = false, banned = false): Promise<boolean> {
	// 	const server = await this.getByDid(guild.id as Snowflake);
	// 	if (server) {
	// 		info(`NOT IMPLEMENTED: ${this.sageCache.bot?.codeName ?? ActiveBot.active?.codeName ?? UnkownBotCodeName} ${banned && "banned" || kicked && "kicked" || "left"} ${guild.name} (${guild.id})`);
	// 		//TODO: IMPLEMENT THIS
	// 	}
	// 	return false;
	// }

	public static fromCore<T = ServerCore, U = Server>(core: T, sageCache: SageCache): Promise<U>;
	public static fromCore(core: ServerCore, sageCache: SageCache): Promise<Server> {
		const server = new Server(core, sageCache);
		return Promise.resolve(server);
	}

}
