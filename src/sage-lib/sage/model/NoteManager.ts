import { StringSet, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { isBlank } from "@rsc-utils/string-utils";
import type { TKeyValuePair } from "./SageMessageArgs.js";

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
	public constructor(private notes: TNote[]) { }

	public getStats(): TNote[] {
		return this.getCategorizedNotes(CategoryStats);
	}
	public getStat(stat: string): TNote | undefined {
		return this.getCategorizedNote(CategoryStats, stat);
	}
	public setStat(stat: string, value: string): boolean {
		return this._setCategorizedNote(CategoryStats, stat, value) !== undefined;
	}
	/** returns keys (lowercased) updated */
	public updateStats(pairs: TKeyValuePair[]): StringSet {
		const keysUpdated = new StringSet();
		pairs.forEach(pair => {
			const updatedNote = this._setCategorizedNote(CategoryStats, pair.key, pair.value);
			if (updatedNote) {
				keysUpdated.add(updatedNote.title);
			}
		});
		return keysUpdated;
	}

	/** returns the note updated */
	private _setCategorizedNote(category: string, title: string, value: Optional<string>): TNote | undefined {
		if (isBlank(value)) {
			const note = this.getCategorizedNote(category, title);
			if (note) {
				this.notes.splice(this.notes.indexOf(note), 1);
				return note;
			}
			return undefined;
		}

		let note = this.getCategorizedNote(category, title);
		if (!note) {
			note = {
				"category": category ?? CategoryUncategorized,
				"title": title ?? Untitled,
				"note": value.trim()
			};
			this.notes.push(note);

		} else {
			note.note = value.trim();
		}
		return note;
	}

	private getCategorizedNotes(category: string): TNote[] {
		const categoryLower = ensure(category).toLowerCase();
		return this.notes.filter(n => compare(n.category, categoryLower));
	}
	public getCategorizedNote(category: string, title: string): TNote | undefined {
		const titleLower = ensure(title).toLowerCase();
		return this.getCategorizedNotes(category).find(n => n.title?.toLowerCase() === titleLower);
	}
	public setCategorizedNote(category: string, title: string, value: string): boolean {
		return this._setCategorizedNote(category, title, value) !== undefined;
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

}
