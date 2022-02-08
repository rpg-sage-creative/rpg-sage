import type { TDetail, THasSuccessOrFailure } from "../sage-pf2e";
import type { UUID } from "../sage-utils";

export type TCore = {
	objectType:string; id:UUID; name:string;
	class?:string; classPath?:string;
	type?:string;
	code?:string;
	aon?:string; aonId?:number;
	source?:string; abbreviation?:string;
	version?: number;
	previousId: UUID;
	parent?: string;
	traits?: string[];
	details?: TDetail[];
	features?: any[];
	ancestry?: string;
} & THasSuccessOrFailure;
