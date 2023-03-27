import type { BotCore, TBotCodeName } from "../model/Bot";
import Bot from "../model/Bot";
import type SageCache from "../model/SageCache";
import DidRepository from "./base/DidRepository";

export default class BotRepo extends DidRepository<BotCore, Bot> {

	public static async fromCore<T = BotCore, U = Bot>(core: T, sageCache: SageCache): Promise<U> {
		return new Bot(core as unknown as BotCore, sageCache) as unknown as U;
	}

	public static async getByCodeName(codeName: TBotCodeName): Promise<Bot | null> {
		const botRepo = new BotRepo(null!),
			botCore = await botRepo.findUncachedCore(core => core.codeName === codeName);
		return botRepo.parseAndCache(botCore);
	}

}
