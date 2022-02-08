import type CharacterManager from "./CharacterManager";
import GameCharacter from "./GameCharacter";

export type TCharacterMatch = {
	index: number;
	match: string;
	character: GameCharacter;
};

export default class CharactersMatch {
	public constructor(public characterManager: CharacterManager, public matches: TCharacterMatch[]) { }
	public get firstCharacter(): GameCharacter { return this.matches[0]?.character; }
	public get firstMatch(): TCharacterMatch { return this.matches[0]; }
	public get length(): number { return this.matches.length; }
	public static match(characterManager: CharacterManager, input: string): CharactersMatch {
		const matches = characterManager.map(char => {
			const match = input.match(new RegExp(`"\\s*${char.name}\\s*"|${char.name}`, "i"));
			if (match) {
				return <TCharacterMatch>{
					index: match.index,
					match: match[0],
					character: char
				};
			}
			const preparedName = GameCharacter.prepareName(char.name);
			const preparedMatch = input.match(new RegExp(`"\\s*${preparedName}\\s*"|${preparedName}`, "i"));
			if (preparedMatch) {
				return <TCharacterMatch>{
					index: preparedMatch.index,
					match: preparedMatch[0],
					character: char
				};
			}
			return null;
		});
		return new CharactersMatch(characterManager, matches.existing());
	}
}
