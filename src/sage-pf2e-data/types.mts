import type { TDetail, THasSuccessOrFailure } from "../sage-pf2e";
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
	/** Domain spell names */
	spells: string[];
	/** FocusSpell domain name */
	domain: string;

	/** Archives linkage */
	aon?:string; aonId?:number;

} & THasSuccessOrFailure;
