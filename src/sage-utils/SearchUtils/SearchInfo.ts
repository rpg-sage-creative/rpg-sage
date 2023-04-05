import XRegExp from "xregexp";
import { isDefinedAndUnique } from "../ArrayUtils";
import { oneToUS, reduceNoise } from "../LangUtils";
import { createQuotedRegex, dequote, tokenize } from "../StringUtils";
import { SearchScore } from "./SearchScore";
import type { ISearchable, TSearchTermMeta } from "./types";

//#region types

type TSearchableContent = string | string[] | undefined;

export type TSearchFlag = "" | "g" | "r" | "gr" | "rg";

//#endregion

//#region helpers

/** Generates a set of search terms with metadata from the given SearchInfo and search string. */
function createTerms(searchInfo: SearchInfo, term: string, regexFlag: boolean): TSearchTermMeta[] {
	const tokenized = tokenize(term, { quoted:createQuotedRegex(true), other:/\S+/ });
	const tokens = tokenized.map(t => t.token);
	const terms = tokens.map(s => dequote(s).trim());
	const reduced = reduceNoise(terms);
	return reduced.map(_term => {
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
			regex: new RegExp(regexFlag ? cleanTerm : XRegExp.escape(cleanTerm), "gi"),
			plus: plus,
			minus: minus
		};
	});
}

//#endregion

export class SearchInfo {
	public globalFlag: boolean;
	public hasMinus = false;
	public hasPlus = false;
	public keyTerm: string | undefined;
	public terms: TSearchTermMeta[];

	public constructor(public searchText: string, flags: TSearchFlag) {
		this.globalFlag = ((searchText.match(/\s\-[gr]*$/i) ?? [])[0] ?? "").includes("g") || flags.includes("g");
		const regexFlag = ((searchText.match(/\s\-[gr]*$/i) ?? [])[0] ?? "").includes("r") || flags.includes("r"),
			term = searchText.replace(/\s\-[gr]*$/i, "").replace(/\s+/g, " ").replace(/([\+\-])\s+(\w)/gi, `$1$2`).trim();
		if (this.globalFlag) {
			this.terms = createTerms(this, term, regexFlag);
		}else {
			this.terms = [{
				term: term,
				regex: new RegExp(regexFlag ? term : XRegExp.escape(term), "gi"),
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

	public score<T extends ISearchable>(searchable: T, ...args: TSearchableContent[]): SearchScore<T> {
		const contents = <string[]>args.flat(Infinity).filter(isDefinedAndUnique),
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