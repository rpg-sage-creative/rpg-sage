import { isBlank, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { TKeyValuePair } from "./SageMessageArgs";

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
		return this._setCategorizedNote(CategoryStats, stat, value);
	}
	public updateStats(pairs: TKeyValuePair[]): boolean {
		let changed = false;
		pairs.forEach(pair => changed = this._setCategorizedNote(CategoryStats, pair.key, pair.value) || changed);
		return changed;
	}

	private _setCategorizedNote(category: string, title: string, value: Optional<string>): boolean {
		if (isBlank(value)) {
			const note = this.getCategorizedNote(category, title);
			if (note) {
				this.notes.splice(this.notes.indexOf(note), 1);
				return true;
			}
			return false;
		}

		const note = this.getCategorizedNote(category, title);
		if (!note) {
			this.notes.push({
				"category": category ?? CategoryUncategorized,
				"title": title ?? Untitled,
				"note": value.trim()
			});

		} else {
			note.note = value.trim();
		}
		return true;
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
		return this._setCategorizedNote(category, title, value);
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
