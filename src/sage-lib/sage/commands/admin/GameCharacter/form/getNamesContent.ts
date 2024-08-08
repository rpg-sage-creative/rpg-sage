import type { GameCharacter } from "../../../../model/GameCharacter.js";

export function getNamesContent(char: GameCharacter): string {
	const lines = [
		`# ${char.name}`,
		`**Nickname (aka)** ${char.aka ?? "*none*"}`,
		`**Alias** ${char.alias ?? "*none*"}`
	];
	const { displayNameTemplate } = char;
	const displayName = char.toDisplayName();
	if (displayNameTemplate) {
		lines.push(`**Display Name**`);
		lines.push(`> Template: ${"`" + displayNameTemplate + "`"}`);
		lines.push(`> Output: ${displayName}`);
	}else {
		lines.push(`**Display Name**`);
		lines.push(`> Template: *none*`);
		// lines.push(`> Output: ${displayName}`);
	}
	return lines.join("\n");
}
