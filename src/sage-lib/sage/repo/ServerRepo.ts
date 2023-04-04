import type { Guild } from "discord.js";
import { ActiveBot } from "../model/ActiveBot";
import type { SageCache } from "../model/SageCache";
import { Server,  ServerCore } from "../model/Server";
import { DidRepository } from "./base/DidRepository";

const UnkownBotCodeName = "<UnknownBot>";

export class ServerRepo extends DidRepository<ServerCore, Server> {

	public getHome(): Promise<Server> {
		return <Promise<Server>>this.getByDid(Server.HomeServerDid);
	}

	/** This finds or creates the server object. It also updates the server name if changed. */
	public async getOrCreateByGuild(guild: Guild): Promise<Server> {
		let server = await this.getByDid(guild.id);
		if (!server) {
			server = new Server(Server.createCore(guild), this.sageCache);
		}
		if (server.name !== guild.name) {
			server.toJSON().name = guild.name;
			await server.save();
		}
		return server;
	}

	public async initializeServer(guild: Guild | null): Promise<boolean> {
		if (!guild) {
			return false;
		}

		const existingServer = await this.getByDid(guild.id);
		if (existingServer) {
			guild = existingServer.discord.guild;
			console.info(`${this.sageCache.bot?.codeName ?? ActiveBot.active?.codeName ?? UnkownBotCodeName} rejoined ${guild?.name} (${guild?.id}) as ${existingServer.id}`);
			return false;
		}

		const server = new Server(Server.createCore(guild), this.sageCache),
			saved = await this.write(server);
		if (saved) {
			console.info(`${this.sageCache.bot?.codeName ?? ActiveBot.active?.codeName ?? UnkownBotCodeName} joined ${guild.name} (${guild.id}) as ${server.id}`);
		}
		return saved;
	}

	public async retireServer(guild: Guild, kicked = false, banned = false): Promise<boolean> {
		const server = await this.getByDid(guild.id);
		if (server) {
			console.info(`NOT IMPLEMENTED: ${this.sageCache.bot?.codeName ?? ActiveBot.active?.codeName ?? UnkownBotCodeName} ${banned && "banned" || kicked && "kicked" || "left"} ${guild.name} (${guild.id})`);
			//TODO: IMPLEMENT THIS
		}
		return false;
	}

	public static fromCore<T = ServerCore, U = Server>(core: T, sageCache: SageCache): Promise<U> {
		return <Promise<U>><unknown>Promise.resolve(new Server(<ServerCore><unknown>core, sageCache));
	}

}
