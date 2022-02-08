import type * as Discord from "discord.js";
import type { IBotCore, TBotCodeName } from "../model/Bot";
import Bot from "../model/Bot";
import type SageCache from "../model/SageCache";
import DidRepository from "./base/DidRepository";

export default class BotRepo extends DidRepository<IBotCore, Bot> {
	// public static active: ActiveBot;

	public static async fromCore<T = IBotCore, U = Bot>(core: T, sageCache: SageCache): Promise<U> {
		return <U><unknown>new Bot(<IBotCore><unknown>core, sageCache);
	}

	public static async getByCodeName(codeName: TBotCodeName): Promise<Bot> {
		const botRepo = new BotRepo(null!),
			botCores = await botRepo.readAllCores(),
			botCore = botCores.find(core => core.codeName === codeName)!;
		return botRepo.getById(botCore.id) as Promise<Bot>;
	}

	public static isTesterBot(userDid: Discord.Snowflake): boolean;
	public static isTesterBot(_: Discord.Snowflake): boolean {
		return false;
	}

}
