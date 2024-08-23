import type { Snowflake } from "@rsc-utils/core-utils";
import { findJsonFile } from "@rsc-utils/io-utils";
import { Bot, type IBotCore, type TBotCodeName } from "../model/Bot.js";
import type { SageCache } from "../model/SageCache.js";
import { DidRepository } from "./base/DidRepository.js";

export class BotRepo extends DidRepository<IBotCore, Bot> {

	public static async fromCore<T = IBotCore, U = Bot>(core: T, sageCache: SageCache): Promise<U> {
		return <U><unknown>new Bot(<IBotCore><unknown>core, sageCache);
	}

	public static async getByCodeName(codeName: TBotCodeName): Promise<Bot> {
		const contentFilter = (core: IBotCore) => core.codeName === codeName;
		const botCore = await findJsonFile(`${DidRepository.DataPath}/${this.objectTypePlural}`, { contentFilter });
		return new Bot(botCore!, null!);
	}

	public static isTesterBot(userDid: Snowflake): boolean;
	public static isTesterBot(_: Snowflake): boolean {
		return false;
	}

}
