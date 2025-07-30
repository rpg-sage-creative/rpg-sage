import type { GameCharacter } from "../sage-lib/sage/model/GameCharacter.js";

let templateRegex: RegExp;

type Results = {
	/** the keys (stats) used in the template; all lower cased */
	keys: Set<Lowercase<string>>;
	/** the title of the template; generally from getStats(key + ".title") */
	title?: string;
	/** the formatted / processed output */
	value?: string;
	/** the formatted / processed output split by new line characters */
	lines: string[];
};

export function processCharacterTemplate(character: GameCharacter, templateKey: string, customTemplate?: string): Results {
	// ensure regex
	templateRegex ??= /{[^}]+}/g;

	// build getter
	const getTemplate = (key: string): string | undefined => key.endsWith(".template") ? character.getStat(key) ?? undefined : undefined;

	// for recursion aversion
	const templateSet = new Set<Lowercase<string>>();

	// for output
	const matchKeys = new Set<Lowercase<string>>();

	// build processor
	const processTemplate = (templateKey: string, template?: string): string | undefined => {
		// get template if not provided
		template ??= getTemplate(templateKey);
		if (template === undefined) return undefined;

		// ensure we haven't run the template before
		const keyLower = templateKey.toLowerCase() as Lowercase<string>;
		if (templateSet.has(keyLower)) return undefined;
		templateSet.add(keyLower);

		return template.replace(templateRegex, match => {
			const matchKey = match.slice(1, -1);

			const templated = processTemplate(matchKey);
			if (templated !== undefined) return templated;

			const stat = character.getStat(matchKey) ?? undefined;
			if (stat !== undefined) {
				matchKeys.add(matchKey.toLowerCase() as Lowercase<string>);
				return stat;
			}

			return match;
		});
	};

	const processedValue = processTemplate(templateKey, customTemplate);

	const templateTitle = processedValue ? character.getStat(`${templateKey}.title`) ?? `Custom Stats` : undefined;

	return {
		keys: matchKeys,
		title: templateTitle,
		value: processedValue,
		lines: processedValue?.split(/[\r\n]/) ?? []
	};
}