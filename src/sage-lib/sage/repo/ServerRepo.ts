import type { SageCache } from "../model/SageCache.js";
import { Server, type ServerCore } from "../model/Server.js";
import { DidRepository } from "./base/DidRepository.js";

export class ServerRepo extends DidRepository<ServerCore, Server> {
	public static fromCore<T = ServerCore, U = Server>(core: T, sageCache: SageCache): Promise<U>;
	public static fromCore(core: ServerCore, sageCache: SageCache): Promise<Server> {
		const server = new Server(core, sageCache);
		return Promise.resolve(server);
	}
}
