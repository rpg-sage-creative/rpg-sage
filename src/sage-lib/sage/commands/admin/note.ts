
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
// 	// 	const filter = sageMessage.args.join(" ");
// 	// 	if (filter) {
// 	// 		const lower = filter.toLowerCase();
// 	// 		notes = notes.filter(note => note.category?.toLowerCase().includes(lower));
// 	// 	}
// 	// }
// 	await renderNotesList(sageMessage, notes);
// }
// registerAdminCommand(notesList, "notes-list");

// async function journalEntry(sageMessage: SageMessage): Promise<void> {
// 	const gameCharacter = sageMessage.game ? sageMessage.playerCharacter : sageMessage.user.playerCharacters.first();
// 	if (gameCharacter) {
// 		const lines = sageMessage.args.join(" ").split(/\n/),
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
// 				warn(`journalEntry(${sageMessage.command})`);
// 				return sageMessage.reactWarn();
// 		}
// 		return sageMessage.reactSuccessOrFailure(updated);
// 	}
// 	return sageMessage.reactWarn();
// }
// registerAdminCommand(journalEntry, "journal-add", "journal-append", "journal-update", "journal-remove");

export function registerNote(): void {
}
