import type { IBotCore, TBotCodeName } from "../model/Bot";
import Bot from "../model/Bot";
import type SageCache from "../model/SageCache";
import DidRepository from "./base/DidRepository";

export default class BotRepo extends DidRepository<IBotCore, Bot> {

	public static async fromCore<T = IBotCore, U = Bot>(core: T, sageCache: SageCache): Promise<U> {
		return new Bot(core as unknown as IBotCore, sageCache) as unknown as U;
	}

	public static async getByCodeName(codeName: TBotCodeName): Promise<Bot | null> {
		const botRepo = new BotRepo(null!),
			botCore = await botRepo.findUncachedCore(core => core.codeName === codeName);
		return botRepo.parseAndCache(botCore);
	}

}
