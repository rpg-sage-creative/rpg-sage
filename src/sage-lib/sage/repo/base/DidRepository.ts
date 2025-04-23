import { type IdCore, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { HasIdCoreAndSageCache, IdRepository } from "./IdRepository.js";

export interface DidCore<T extends string = string> extends IdCore<T> {
	/** @deprecated */
	did: Snowflake;
}

export class HasDidCore<T extends DidCore<U>, U extends string = string> extends HasIdCoreAndSageCache<T, U> {
	/** @deprecated */
	public get did(): Snowflake { return this.core.did; }
}

export abstract class DidRepository<T extends DidCore, U extends HasDidCore<T>> extends IdRepository<T, U> {

	//#region Entities

	/** Gets the entity by did, checking cache first, then .readByDid(), then .readFromUncached(). */
	public async getByDid(did: Optional<Snowflake>): Promise<U | null> {
		return super.getById(did);
	}

	//#endregion
}
