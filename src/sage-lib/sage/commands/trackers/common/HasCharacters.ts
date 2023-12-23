import { CharacterShell, type CharacterShellCore } from "../../../model/CharacterShell";
import type Game from "../../../model/Game";
import type GameCharacter from "../../../model/GameCharacter";
import type { CharArg } from "./getCharArgs";

export type HasCharactersCore = {
	/** character shell cores */
	characters: CharacterShellCore[];
};

export type CharacterSorter = (a: CharacterShell, b: CharacterShell) => -1 | 0 | 1;

export abstract class HasCharacters<Core extends HasCharactersCore> {
	declare protected core: Core;
	declare public game: Game;
	declare public id: string;
	declare public name: string;
	protected abstract changed(): void;
	protected abstract getCharacterSorter(): CharacterSorter;

	private pairChar(shellCore: CharacterShellCore): CharacterShell {
		const gameChar = this.game.playerCharacters.findById(shellCore.gameCharacterId)
			?? this.game.nonPlayerCharacters.findById(shellCore.gameCharacterId);
		return new CharacterShell(shellCore, gameChar);
	}

	private findChar(idOrLabel: string): CharacterShellCore | undefined {
		const regex = new RegExp(`^${idOrLabel}$`, "i");
		return this.characterCores.find(c => regex.test(c.id) || regex.test(c.label));
	}

	public get characterCores(): CharacterShellCore[] { return this.core.characters ?? (this.core.characters = []); }

	public addChar(char: GameCharacter, nickname= char.name): CharacterShell {
		const gameCharacterId = char.id;
		const id = String(Date.now());
		const type = char.type;

		let suffixIndex = -1;
		const suffixes = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const regex = new RegExp(`^${nickname}$`, "i");
		const existing = this.characterCores.filter(char => regex.test(char.nickname));
		existing.forEach(ch => {
			if (!ch.suffix) {
				ch.suffix = "A";
				ch.label = `${ch.nickname} ${ch.suffix}`;
			}
			suffixIndex = Math.max(suffixIndex, suffixes.indexOf(ch.suffix) + 1);
		});
		const suffix = suffixes[suffixIndex];

		const label = suffix ? `${nickname} ${suffix}` : nickname;

		const charData = { gameCharacterId, id, label, nickname, suffix, type };
		this.characterCores.push(charData);
		this.changed();
		return new CharacterShell(charData, char);
	}

	public addChars(charArgs: CharArg[]): CharacterShell[] {
		const characters: CharacterShell[] = [];
		charArgs.forEach(charArg => {
			for (let i = 0; i < charArg.count; i++) {
				characters.push(this.addChar(charArg.char, charArg.nickname));
			}
		});
		return characters;
	}

	public getCharPair(value: string): CharacterShell | null {
		const shellCore = this.findChar(value);
		return shellCore ? this.pairChar(shellCore) : null;
	}

	public getSortedCharacters(): CharacterShell[] {
		const characters = this.characterCores.map(shellCore => this.pairChar(shellCore));
		characters.sort(this.getCharacterSorter());
		return characters;
	}

	public hasChar(charOrValue: string | GameCharacter): boolean {
		const value = typeof(charOrValue) === "string" ? charOrValue : charOrValue.id;
		return !!this.findChar(value);
	}

	public removeChar(value: string): boolean {
		const startLength = this.characterCores.length;
		const char = this.findChar(value);
		if (char) {
			this.core.characters = this.characterCores.filter(c => c !== char);
		}
		const changed = this.core.characters.length < startLength;
		if (changed) {
			this.changed();
			return true;
		}
		return false;
	}

}