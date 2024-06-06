import { getSuperUserId } from "@rsc-utils/core-utils";
import type { Snowflake } from "@rsc-utils/core-utils";
import type { SageCache } from "../model/SageCache.js";
import { User, type UserCore } from "../model/User.js";
import { DidRepository } from "./base/DidRepository.js";

export class UserRepo extends DidRepository<UserCore, User> {

	public getSuperUser(): Promise<User> {
		return this.getByDid(getSuperUserId()) as Promise<User>;
	}

	public async getOrCreateByDid(userDid: Snowflake): Promise<User> {
		return await this.getByDid(userDid) ?? new User(User.createCore(userDid), this.sageCache);
	}

	public static fromCore<T = UserCore, U = User>(core: T, sageCache: SageCache): Promise<U>;
	public static fromCore(core: UserCore, sageCache: SageCache): Promise<User> {
		return Promise.resolve(new User(core, sageCache));
	}
}
