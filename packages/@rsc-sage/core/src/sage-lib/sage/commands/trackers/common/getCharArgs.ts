import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";

export type CharArg = {
	name: string;
	nickname: string;
	char: GameCharacter;
	count: number;
};

const nickRegex = /^(as|nick)$/i;
const charRegex = /^(char|n?pc)$/i;
export function getCharArgs(sageMessage: SageMessage): CharArg[] {
	const args = sageMessage.args.manager.keyValueArgs()
		.map(arg => ({ ...arg, isNick: nickRegex.test(arg.key), isChar: charRegex.test(arg.key), isCount: arg.keyLower === "count" }))
		.filter(kvp => (kvp.isNick || kvp.isChar || kvp.isCount) && (kvp.value ?? "").length);
	if (!args.find(kvp => kvp.isChar)) {
		return [];
	}

	const characters: CharArg[] = [];
	while (args.length) {
		const charArg = args.shift();
		if (charArg?.isChar) {
			const otherArgs = [];
			// must use === false to avoid pushing an infinite array of undefined values
			while (args[0]?.isChar === false) {
				otherArgs.push(args.shift()!);
			}

			const name = charArg.value!;
			const charOrShell = sageMessage.game?.findCharacterOrCompanion(name);
			const char = charOrShell && "game" in charOrShell ? charOrShell.game : charOrShell;
			if (charOrShell && char) {
				const nickArg = otherArgs.find(arg => arg.isNick);
				const nickname = nickArg?.value ?? charOrShell.name ?? name;

				const countArg = otherArgs.find(arg => arg.isCount);
				const count = countArg?.value ? +countArg.value : 1;

				characters.push({ name, nickname, char, count });
			}
		}
	}
	return characters;
}