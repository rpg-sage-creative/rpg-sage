import type { Pf2tBaseCore } from "../sage-pf2e/model/base/Pf2tBase";
import type { TDetail, THasSuccessOrFailure } from "../sage-pf2e/model/base/interfaces";
import type { UUID } from "../sage-utils/UuidUtils";

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

	/** PF2 Tools linkage */
	pf2t?: Pf2tBaseCore;

} & THasSuccessOrFailure;
