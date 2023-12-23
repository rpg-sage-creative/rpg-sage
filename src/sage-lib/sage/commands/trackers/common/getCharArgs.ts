import type GameCharacter from "../../../model/GameCharacter";
import type SageMessage from "../../../model/SageMessage";

export type CharArg = {
	name: string;
	nickname: string;
	char: GameCharacter;
	count: number;
};

export function getCharArgs(sageMessage: SageMessage): CharArg[] {
	const asRegex = /^(as|nick)$/i;
	const keyRegex = /^(char|n?pc)$/i;
	const countRegex = /^count$/i;
	const args = sageMessage.args.keyValuePairs()
		.map(kvp => ({ ...kvp, isAs: asRegex.test(kvp.key), isKey: keyRegex.test(kvp.key), isCount: countRegex.test(kvp.key) }))
		.filter(kvp => (kvp.isAs || kvp.isKey || kvp.isCount) && (kvp.value ?? "").length);
	if (!args.find(kvp => kvp.isKey)) {
		return [];
	}

	const characters: CharArg[] = [];
	while (args.length) {
		const keyArg = args.shift()!;
		if (keyArg.isKey) {
			let asArg = args[0]?.isAs ? args.shift() : null;
			if (!asArg) {
				asArg = args[1]?.isAs ? args.splice(1, 1)[0] : null;
			}

			const name = keyArg.value!;
			const charOrShell = sageMessage.game?.findCharacterOrCompanion(name);
			const char = charOrShell && "game" in charOrShell ? charOrShell.game : charOrShell;
			if (charOrShell && char) {
				const nickname = asArg?.value ?? charOrShell.name ?? name;
				let countArg = args[0]?.isCount ? args.shift() : null;
				if (!countArg) {
					countArg = args[1]?.isCount ? args.splice(1, 1)[0] : null;
				}
				const count = countArg?.value ? +countArg.value : 1;
				characters.push({ name, nickname, char, count });
			}
		}
	}
	return characters;
}