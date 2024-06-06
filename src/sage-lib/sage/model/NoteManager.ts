import { toUniqueDefined } from "@rsc-utils/array-utils";
import type { Snowflake } from "@rsc-utils/core-utils";
import type { TKeyValuePair } from "./SageMessageArgs";

interface IHasSave { save(): Promise<boolean>; }

export type TNoteCategory = {
	category: string;
	notes: TNote[];
};
export type TNote = {
	ownerDid?: Snowflake;
	category: string;
	title: string;
	note: string;
};

const CategoryJournal = "Journal";
const CategoryStats = "Stats";
const CategoryUncategorized = "Uncategorized";
const Untitled = "Untitled";

function ensure(input: string, defaultValue = ""): string {
	return (input ?? "").trim() || defaultValue;
}
function compare(input: string, lower: string): boolean {
	return ensure(input).toLowerCase() === lower;
}

export class NoteManager {
	public constructor(private notes: TNote[], protected owner?: IHasSave) { }

	public getCategories(): string[] {
		return this.notes.map(note => ensure(note.category, CategoryUncategorized)).filter(toUniqueDefined);
	}
	public getCategorized(): TNoteCategory[] {
		const categories = this.getCategories();
		return categories.map(category => {
			return {
				category: category,
				notes: this.notes.filter(note => category === ensure(note.category, CategoryUncategorized))
			};
		});
	}

	//#region Journal
	public getJournalEntries(): TNote[] {
		return this.getCategorizedNotes(CategoryJournal);
	}
	public getJournalEntry(title: string): TNote | undefined {
		return this.getCategorizedNote(CategoryJournal, title);
	}
	public appendJournalEntry(title: string, entry: string): Promise<boolean> {
		const existing = this.getCategorizedNote(CategoryJournal, title);
		const appendedEntry = existing ? `${existing.note}\n${entry}` : entry;
		return this.setCategorizedNote(CategoryJournal, title, appendedEntry);
	}
	public setJournalEntry(title: string, entry: string): Promise<boolean> {
		return this.setCategorizedNote(CategoryJournal, title, entry);
	}
	public unsetJournalEntry(title: string): Promise<boolean> {
		return this.unsetCategorizedNote(CategoryJournal, title);
	}
	//#endregion

	//#region Stats
	public getStats(): TNote[] {
		return this.getCategorizedNotes(CategoryStats);
	}
	public getStat(stat: string): TNote | undefined {
		return this.getCategorizedNote(CategoryStats, stat);
	}
	public setStat(stat: string, value: string): Promise<boolean> {
		return this.setCategorizedNote(CategoryStats, stat, value);
	}
	public setStats(pairs: TKeyValuePair[]): Promise<boolean> {
		return this.updateStats(pairs);
	}
	public updateStats(pairs: TKeyValuePair[], save = true): Promise<boolean> {
		let changed = false;
		pairs.forEach(pair => changed = this._setCategorizedNote(CategoryStats, pair.key, pair.value) || changed);
		return changed && save ? this.save() : Promise.resolve(false);
	}
	public unsetStat(stat: string): Promise<boolean> {
		return this.unsetCategorizedNote(CategoryStats, stat);
	}
	public unsetStats(...stats: string[]): Promise<boolean> {
		let save = false;
		stats.forEach(stat => save = this._unsetCategorizedNote(CategoryStats, stat) || save);
		return save ? this.save() : Promise.resolve(false);
	}
	//#endregion

	private _setCategorizedNote(category: string, title: string, value: string): boolean {
		const cleanValue = (value ?? "").trim();
		if (!cleanValue) {
			return this._unsetCategorizedNote(category, title);
		}
		const note = this.getCategorizedNote(category, title);
		if (!note) {
			this.notes.push({
				"category": category ?? CategoryUncategorized,
				"title": title ?? Untitled,
				"note": cleanValue
			});
		} else {
			note.note = cleanValue;
		}
		return true;
	}
	private _unsetCategorizedNote(category: string, title: string): boolean {
		const note = this.getCategorizedNote(category, title);
		if (note) {
			this.notes.splice(this.notes.indexOf(note), 1);
			return true;
		}
		return false;
	}

	//#region Categorized
	public getCategorizedNotes(category: string): TNote[] {
		const categoryLower = ensure(category).toLowerCase();
		return this.notes.filter(n => compare(n.category, categoryLower));
	}
	public getCategorizedNote(category: string, title: string): TNote | undefined {
		const titleLower = ensure(title).toLowerCase();
		return this.getCategorizedNotes(category).find(n => n.title?.toLowerCase() === titleLower);
	}
	public setCategorizedNote(category: string, title: string, value: string): Promise<boolean> {
		return this._setCategorizedNote(category, title, value) ? this.save() : Promise.resolve(false);
	}
	public unsetCategorizedNote(category: string, title: string): Promise<boolean> {
		return this._unsetCategorizedNote(category, title) ? this.save() : Promise.resolve(false);
	}
	//#endregion

	//#region Uncategorized
	public getUncategorizedNotes(): TNote[] {
		return this.getCategorizedNotes(CategoryUncategorized);
	}
	public getUncategorizedNote(title: string): TNote | undefined {
		return this.getCategorizedNote(CategoryUncategorized, title);
	}
	public setUncategorizedNote(title: string, value: string): Promise<boolean> {
		return this.setCategorizedNote(CategoryUncategorized, title, value);
	}
	public unsetUncategorizedNote(title: string): Promise<boolean> {
		return this.unsetCategorizedNote(CategoryUncategorized, title);
	}
	//#endregion

	//#region Untitled
	public addNote(note: string): Promise<boolean> {
		this.notes.push({ category: CategoryUncategorized, title: Untitled, note: note });
		return this.save();
	}
	public removeNote(note: string): Promise<boolean> {
		const found = this.notes.filter(_note => _note.category === CategoryUncategorized && _note.title === Untitled && _note.note === note);
		if (found.length) {
			found.reverse();
			found.forEach(_note => {
				this.notes.splice(this.notes.indexOf(_note), 1);
			});
			return this.save();
		}
		return Promise.resolve(false);
	}
	//#endregion

	protected save(): Promise<boolean> {
		return this.owner ? this.owner.save() : Promise.resolve(false);
	}

	public get size(): number {
		return this.notes.length;
	}

	public format(input: string): string {
		//TODO: REDO THIS REGEX As /{[^:]+:[^}]}/ and dequote
		return input.replace(/\{(?:([\w\-]+)|"([^"]+)"):(?:([\w\-]+)|"([^"]+)")\}/gi, (match, category, quotedCategory, title, quotedTitle) => {
			const note = this.getCategorizedNote(category || quotedCategory, title || quotedTitle);
			return note ? note.note : match;
		});
	}

	// public static parseKeyValuePairs(input: string): TKeyValuePair[] {
	// 	return ArgsManager.tokenize(input).map(token => {
	// 		const match = token.match(XRegExp("^([\\pL\\pN]+)(?:=(.*?))$", "i"));
	// 		return {
	// 			key: match[1],
	// 			value: match[2] ?? undefined
	// 		};
	// 	});
	// }
	// public static parseKeys(input: string): string[] {
	// 	return NoteManager.parseKeyValuePairs(input)
	// 		.filter(pair => pair.value === undefined) // confirm that undefined is right, instead of using null or isDefined
	// 		.map(pair => pair.key);
	// 	// warn("DON'T USE NoteManager.parseKeys()! reuse other code");
	// 	// return tokenize(input, { quote:/"[^"]+"/, nonSpace:/\S+/ })
	// 	// 	.map(token => SageMessageArgs.dequote(token.token))
	// 	// 	.filter(key => key);
	// }
}
