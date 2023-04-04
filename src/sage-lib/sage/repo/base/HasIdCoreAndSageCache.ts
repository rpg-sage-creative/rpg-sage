import { HasIdCore, IdCore } from "../../../../sage-utils/ClassUtils";
import type { SageCache } from "../../model/SageCache";

/** Represents a class that is an IdCore but also has SageCache for Discord related functionality. */
export class HasIdCoreAndSageCache<T extends IdCore<U>, U extends string = string> extends HasIdCore<T, U> {
	public constructor(core: T, protected sageCache: SageCache) { super(core); }
}