import type { Snowflake } from "discord.js";
import type { SageCache } from "../model/SageCache";
import { User,  UserCore } from "../model/User";
import { DidRepository } from "./base/DidRepository";

export class UserRepo extends DidRepository<UserCore, User> {

	public getSuperUser(): Promise<User> {
		return this.getByDid(User.SuperUserDid) as Promise<User>;
	}

	public async getOrCreateByDid(userDid: Snowflake): Promise<User> {
		return await this.getByDid(userDid) ?? new User(User.createCore(userDid), this.sageCache);
	}

	public static fromCore<T = UserCore, U = User>(core: T, sageCache: SageCache): Promise<U> {
		return Promise.resolve(new User(<UserCore><unknown>core, sageCache)) as unknown as Promise<U>;
	}
}
