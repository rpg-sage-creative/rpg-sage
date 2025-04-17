import { toUniqueDefined } from "../array/index.js";
import { oneToUS } from "../language/oneToUs.js";
import { reduceNoiseUS } from "../language/reduceNoiseUS.js";
import { escapeRegex } from "../regex/escapeRegex.js";
import { dequote } from "../string/index.js";
import { tokenize } from "../string/tokenize.js";
import { SearchScore, type SearchTermData } from "./SearchScore.js";
import type { Searchable } from "./Searchable.js";

function createRegex(value: string, flags = "gi"): RegExp {
	return new RegExp(escapeRegex(value), flags);
}

type TSearchableContent = string | string[] | undefined;
export type TSearchFlag = "" | "g" | "r" | "gr" | "rg";

function createTerms(searchInfo: SearchInfo, term: string, regexFlag: boolean) {
	const tokens = tokenize(term, { quoted:/"[^"]*"/, other:/\S+/ });
	const terms = tokens.map(token => token.token).map(s => dequote(s)).filter(toUniqueDefined);
	return reduceNoiseUS(terms).map(_term => {
		const minus = _term.startsWith("-"),
			plus = _term.startsWith("+"),
			cleanTerm = oneToUS(minus || plus ? _term.slice(1) : _term);
		if (minus) {
			searchInfo.hasMinus = true;
		}
		if (plus) {
			searchInfo.hasPlus = true;
		}
		return {
			term: cleanTerm,
			regex: regexFlag ? new RegExp(cleanTerm, "gi") : createRegex(cleanTerm),
			plus: plus,
			minus: minus
		};
	});
}

export class SearchInfo {
	public globalFlag: boolean;
	public hasMinus = false;
	public hasPlus = false;
	public keyTerm: string | undefined;
	public terms: SearchTermData[];

	public constructor(public searchText: string, flags: TSearchFlag) {
		this.globalFlag = ((searchText.match(/\s\-[gr]*$/i) ?? [])[0] ?? "").includes("g") || flags.includes("g");
		const regexFlag = ((searchText.match(/\s\-[gr]*$/i) ?? [])[0] ?? "").includes("r") || flags.includes("r"),
			term = searchText.replace(/\s\-[gr]*$/i, "").replace(/\s+/g, " ").replace(/([\+\-])\s+(\w)/gi, `$1$2`).trim();
		if (this.globalFlag) {
			this.terms = createTerms(this, term, regexFlag);
		}else {
			this.terms = [{
				term: term,
				regex: regexFlag ? new RegExp(term, "gi") : createRegex(term),
				plus: false,
				minus: false
			}];
		}
	}

	public clone<T>(object: T): T {
		return clone("core", object, this);
	}

	public mark(content: string): string;
	public mark(content: string[]): string[];
	public mark(content: TSearchableContent): TSearchableContent {
		return content;
		// TODO: mark terms with <mark>
	}

	public score<T extends Searchable>(searchable: T, ...args: TSearchableContent[]): SearchScore<T> {
		const contents = args.flat(Infinity).filter(toUniqueDefined) as string[],
			score = new SearchScore(searchable);
		this.terms.forEach(termInfo => {
			const mapped = contents.map(s => (termInfo.regex ? s.match(termInfo.regex) ?? [] : []).length);
			const reduced = mapped.reduce((sum, count) => sum + count, 0);
			score.add(termInfo, reduced);
		});
		return score;
	}

	public test(...args: TSearchableContent[]): boolean {
		// Because we never render the score, we don't need an actual ISearchable object
		return this.score(null!, ...args).bool;
	}
}

//TODO: WHY AM I CLONING TWICE!?
interface IClone { original: any; clone: any; }
function clone(objectKey: string, object: any, searchInfo: SearchInfo, clones: IClone[] = []): any {
	if (object === undefined || object === null) {
		return object;
	}
	if (object instanceof Date) {
		return new Date(object);
	}
	switch (typeof(object)) {
		case "string": return objectKey === "name" || searchInfo.globalFlag ? searchInfo.mark(object) : object;
		case "number": case "boolean": return object;
		case "function": return Error("Cannot clone a function.");
		default: break;
	}
	return _clone(objectKey, object, searchInfo, clones);
}

function _clone(objectKey: string, object: any, searchInfo: SearchInfo, clones: IClone[]): any {
	const pair = clones.find(c => c.original === object);
	let cloned = pair && pair.clone || null;
	if (cloned === null) {
		if (Array.isArray(object)) {
			cloned = [];
			clones.push({ original:object, clone:cloned });
			object.forEach((o, i) => cloned[i] = clone(objectKey, o, searchInfo, clones));
		}else if (typeof(object.clone) === "function") {
			cloned = object.clone();
		}else {
			cloned = {};
			clones.push({ original:object, clone:cloned });
			Object.keys(object).forEach(key => {
				if (object.hasOwnProperty(key)) {
					cloned[key] = clone(key, object[key], searchInfo, clones);
				}
			});
		}
	}
	return cloned;
}