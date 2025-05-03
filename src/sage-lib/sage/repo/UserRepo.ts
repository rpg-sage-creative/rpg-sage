// import { getSuperUserId } from "@rsc-sage/env";
import type { SageCache } from "../model/SageCache.js";
import { User, type UserCore } from "../model/User.js";
import { DidRepository } from "./base/DidRepository.js";

export class UserRepo extends DidRepository<UserCore, User> {
	public static fromCore<T = UserCore, U = User>(core: T, sageCache: SageCache): Promise<U>;
	public static fromCore(core: UserCore, sageCache: SageCache): Promise<User> {
		return Promise.resolve(new User(core, sageCache));
	}
}
