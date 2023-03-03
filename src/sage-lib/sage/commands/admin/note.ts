import type GameCharacter from "../../model/GameCharacter";
import type SageMessage from "../../model/SageMessage";
import { registerAdminCommand } from "../cmd";
import { registerAdminCommandHelp } from "../help";
import { sendGameCharacter } from "./gameCharacter";

// async function renderNotesList(sageMessage: SageMessage, notes = sageMessage.user.notes): Promise<void> {
// 	const renderableContent = createAdminRenderableContent(BotRepo.active);
// 	renderableContent.setTitle(`<b>notes-list</b>`);
// 	if (notes.size) {
// 		const categorized = notes.getCategorized();
// 		categorized.forEach(cat => {
// 			renderableContent.appendTitledSection(cat.category, ...cat.notes.map(note => note.title ? `<b>${note.title}</b> ${note.note}` : note.note));
// 		});
// 	}else {
// 		renderableContent.append(`<blockquote>No Notes Found!</blockquote>`);
// 	}
// 	await sageMessage.send(renderableContent);
// 	return Promise.resolve();
// }

/*
User Notes
User PC Notes
Game Notes
Game PC Notes
*/

// async function notesList(sageMessage: SageMessage): Promise<void> {
// 	let notes = sageMessage.user.notes;
// 	// if (notes.size) {
// 	// 	const filter = sageMessage.args.unkeyedValues().join(" ");
// 	// 	if (filter) {
// 	// 		const lower = filter.toLowerCase();
// 	// 		notes = notes.filter(note => note.category?.toLowerCase().includes(lower));
// 	// 	}
// 	// }
// 	await renderNotesList(sageMessage, notes);
// }
// registerAdminCommand(notesList, "notes-list");
// registerAdminCommandHelp("Admin", "Notes", "notes list");
// registerAdminCommandHelp("Admin", "Notes", "notes list {optionalCategoryFilter}");

// type TCharacterAndInput = { character: GameCharacter; input: string; };
function getPcForStats(sageMessage: SageMessage): GameCharacter | undefined {
	if (sageMessage.game && sageMessage.isPlayer) {
		return sageMessage.playerCharacter;
	}
	const name = sageMessage.args.valueByKey("name");
	const owner = sageMessage.game ?? sageMessage.sageUser;
	const char = owner.playerCharacters.findByName(name);
	return char ?? undefined;
}
function getNpcForStats(sageMessage: SageMessage): GameCharacter | undefined {
	const name = sageMessage.args.valueByKey("name");
	const owner = sageMessage.game ?? sageMessage.sageUser;
	const char = owner.nonPlayerCharacters.findByName(name);
	return char ?? undefined;
}
async function statsSet(sageMessage: SageMessage): Promise<void> {
	const character = getPcForStats(sageMessage) || getNpcForStats(sageMessage);
	if (!character) {
		return sageMessage.reactWarn();
	}
	const updated = await character.notes.setStats(sageMessage.args.keyed());
	if (updated) {
		await sendGameCharacter(sageMessage, character);
	}
	return sageMessage.reactSuccessOrFailure(updated);
}
// async function statsUnset(sageMessage: SageMessage): Promise<void> {
// 	const charAndInput = getPcForStats(sageMessage) || getNpcForStats(sageMessage);
// 	if (!charAndInput) {
// 		return sageMessage.reactWarn();
// 	}
// 	const stats = NoteManager.parseKeys(charAndInput.input),
// 		updated = await charAndInput.character.notes.unsetStats(...stats);
// 	if (updated) {
// 		await sendGameCharacter(sageMessage, charAndInput.character);
// 	}
// 	return sageMessage.reactSuccessOrFailure(updated);
// }

// async function journalEntry(sageMessage: SageMessage): Promise<void> {
// 	const gameCharacter = sageMessage.game ? sageMessage.playerCharacter : sageMessage.user.playerCharacters.first();
// 	if (gameCharacter) {
// 		const lines = sageMessage.args.unkeyedValues().join(" ").split(/\n/),
// 			title = lines.shift();
// 		let updated: boolean;
// 		switch(sageMessage.command) {
// 			case "journal-add":
// 			case "journal-update":
// 					updated = await gameCharacter.notes.setJournalEntry(title, lines.join("\n"));
// 				break;
// 			case "journal-append":
// 				updated = await gameCharacter.notes.appendJournalEntry(title, lines.join("\n"));
// 				break;
// 			case "journal-remove":
// 				updated = await gameCharacter.notes.unsetJournalEntry(title);
// 				break;
// 			default:
// 				console.warn(`journalEntry(${sageMessage.command})`);
// 				return sageMessage.reactWarn();
// 		}
// 		return sageMessage.reactSuccessOrFailure(updated);
// 	}
// 	return sageMessage.reactWarn();
// }
// registerAdminCommand(journalEntry, "journal-add", "journal-append", "journal-update", "journal-remove");
// registerAdminCommandHelp("Admin", "Journal", `journal add {entry title}\n{journal entry}`);
// registerAdminCommandHelp("Admin", "Journal", `journal append {entry title}\n{journal entry addition}`);
// registerAdminCommandHelp("Admin", "Journal", `journal update {entry title}\n{updated journal entry}`);
// registerAdminCommandHelp("Admin", "Journal", `journal remove {entry title}`);

export default function register(): void {
	registerAdminCommand(statsSet, "stats-set");
	// registerAdminCommand(statsUnset, "stats-unset");
	registerAdminCommandHelp("Admin", "Stats", `stats set {stat}={value}`);
	// registerAdminCommandHelp("Admin", "Stats", `stats unset {stat}`);
}
