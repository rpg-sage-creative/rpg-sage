import type { Pf2tBaseCore, TDetail, THasSuccessOrFailure } from "../sage-pf2e";
import type { UUID } from "../sage-utils";

export type TCore = {
	objectType:string; id:UUID; name:string;
	class?:string; classPath?:string;
	type?:string;
	code?:string;
	source?:string; abbreviation?:string;
	version?: number;
	previousId: UUID;
	parent?: string;
	traits?: string[];
	details?: TDetail[];
	features?: any[];
	ancestry?: string;
	category?: string;

	/** Archives linkage */
	aon?:string; aonId?:number;

	/** PF2 Tools linkage */
	pf2t?: Pf2tBaseCore;

} & THasSuccessOrFailure;
