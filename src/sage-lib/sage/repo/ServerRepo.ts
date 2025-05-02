import { getHomeServerId } from "@rsc-sage/env";
import { type Snowflake } from "@rsc-utils/core-utils";
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
