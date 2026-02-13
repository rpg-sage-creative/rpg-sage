import type { Note } from "../../types/index.js";
import { isSimpleObject, isValidString } from "./index.js";

export function isNote(note: unknown): note is Note {
	if (isSimpleObject(note) && "ownerDid" in note) throw new Error(`Note with ownerDid!`);
	return isSimpleObject(note)
		&& isValidString(note.category)
		&& isValidString(note.title)
		&& isValidString(note.note);
}