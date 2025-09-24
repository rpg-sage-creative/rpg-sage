import { getCodeBlockRegex, tokenize, type Optional, type TypedRegExp } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { unquote } from "../internal/unquote.js";
import { doStatMath } from "./doStatMath.js";
import type { StatsCharacter, StatsCharacterManager, StatsEncounterManager } from "./types.js";

type CharReferenceGroups = {
	gm?: "gm";
	pc?: "pc";
	stat?: "stat";
	alt?: "alt"|"companion"|"familiar"|"hireling";
};
let charReferenceRegex: TypedRegExp<CharReferenceGroups>;
function getCharReferenceRegex(): TypedRegExp<CharReferenceGroups> {
	return charReferenceRegex ??= regex("i")`
		^
		(?<gm> \bgm\b )?
		(?<pc> \bpc\b )?
		(?<stat> \bstat\b )?
		(?<alt> \balt\b | \bcompanion\b | \bfamiliar\b | \bhireling\b )?
		$
	` as TypedRegExp<CharReferenceGroups>;
}

type StatBlockGroups = {
	implicit?: "::";
	charReference?: string;
	statKey: string;
	defaultValue?: string;
};
let statBlockRegex: TypedRegExp<StatBlockGroups>;
function getStatBlockRegex(): TypedRegExp<StatBlockGroups> {
	return statBlockRegex ??= regex("i")`
		(?!<\{)\{
			(
				(?<implicit> :: )
				|
				(?<charReference> [\w\s]+ | "[\w\s]+" )
				::

			)?
			(?<statKey> [\w\-.]+ )
			(
				:
				(?<defaultValue> [^\{\}]+ )
			)?
		\}(?!=\})
	` as TypedRegExp<StatBlockGroups>;
}

// let statBlockTestRegex: RegExp;
// function getStatBlockTestRegex() {
// 	return statBlockTestRegex ??= regex("i")`
// 		\{{2}
// 			(
// 				(?<testChar> [\w\s]+ | "[\w\s]+" )
// 				::
// 			)?
// 			(?<testKey> [\w\-.]+ )
// 			(?<test> <= | < | >= | > | != | == | = )
// 			(?<testValue> [^\{\}\?]+ )
// 			/? (?<truthyValue> [^:]+ )
// 			:  (?<falseyValue> .*? )
// 		\}{2}
// 	`;
// }

type AltType = "alt" | "companion" | "familiar" | "hireling";

type CharReference = {
	/** if the value represents an alias or name, this is that value */
	aliasOrName?: string;

	/** if isAlt, then this is: "alt" | "companion" | "familiar" | "hireling" */
	altType?: AltType;

	/** value was null, undefined, empty, or only whitespace */
	isEmpty?: boolean;

	/** value was "alt" | "companion" | "familiar" | "hireling" */
	isAlt?: boolean;

	/** value was "gm" */
	isGM?: boolean;

	/** value was "stat" or ""; this means use the current character as context for the stat */
	isImplicit?: boolean;

	/** value was "pc"; this means use the "primary player character" */
	isPC?: boolean;

	/** used with statKey to avoid recursion */
	stackValue?: string;
};

type StatBlock = {
	char: CharReference;
	statKey: string;
	defaultValue?: string;

	/** used to avoid recursion */
	stackValue: Lowercase<string>;
};

type StatCharacters = {
	actingCharacter?: StatsCharacter;

	primaryPlayerCharacter?: StatsCharacter;
	primaryCompanionCharacter?: StatsCharacter;

	gmCharacters?: StatsCharacter[];
	playerCharacters?: StatsCharacterManager;
	nonPlayerCharacters?: StatsCharacterManager;

	encounters?: StatsEncounterManager;
};

type ProcessOptions = {
	actingCharacter?: StatsCharacter;
	matches: Set<Lowercase<string>>;
	stack: Lowercase<string>[];
};

type ProcessTemplateResults = {
	/** the keys (stats) used in the template; all lower cased */
	keys: Set<Lowercase<string>>;
	/** the title of the template; generally from getStats(key + ".title") */
	title?: string;
	/** the formatted / processed output */
	value?: string;
	/** the formatted / processed output split by new line characters */
	lines: string[];
};

export class StatBlockProcessor {
	public constructor(public chars: StatCharacters) { }

	public get hasActingChar(): boolean {
		return !!this.chars.actingCharacter;
	}

	public get isEmpty(): boolean {
		const { chars } = this;
		const keys = Object.keys(chars) as (keyof StatCharacters)[];
		for (const key of keys) {
			if (chars[key]) return false;
		}
		return true;
	}

	/** Gets stat for the given key as a number from the acting character. */
	public getNumber(key: string): number | undefined {
		return this.chars.actingCharacter?.getNumber(key);
	}

	public getStat(key: string) {
		const stat = this.chars.actingCharacter?.getStat(key, true);
		if (!stat?.isDefined) return undefined;

		const processed = this.processStatBlocks(`{${key}}`);
		if (processed !== stat.value) {
			return { key:stat.key, processed:true, raw:stat.value, value:processed };
		}
		return { key:stat.key, value:stat.value };
	}

	/** Gets stat for the given key as a string from the acting character. */
	public getString(key: string): string | undefined {
		return this.chars.actingCharacter?.getString(key);
	}


	/** Parses the given value to see if it has a CharReference. */
	protected parseCharReference(value: Optional<string>): CharReference {
		// make sure we have a usable value
		value = value?.trim();
		if (!value) return { isEmpty:true };

		// if quoted, make sure the unquoted value is usable
		value = unquote(value).trim();
		if (!value) return { isEmpty:true };

		const { gm, pc, stat, alt } = (this.constructor as typeof StatBlockProcessor).getCharReferenceRegex().exec(value)?.groups ?? {};

		if (gm) {
			return { isGM:true, stackValue:"gm" };
		}

		if (pc) {
			return { isPC:true, stackValue:"pc" };
		}

		if (stat) {
			return { isImplicit:true }
		}

		if (alt) {
			return { altType:alt.toLowerCase<AltType>(), isAlt:true, stackValue:alt };
		}

		return { aliasOrName:value, stackValue:value };
	}

	public processStatBlocks(value: Optional<string>): string {
		if (!value) return "";
		return this._process(value, { matches:new Set(), stack:[] });
	}

	public processTemplate(templateKey: string): ProcessTemplateResults {
		const matchKeys = new Set<Lowercase<string>>();
		const initialValue = `{${templateKey.replace(/\.template$/i, "")}.template}`;
		const processedValue = this._process(initialValue, { matches:matchKeys, stack:[] });
		const processed = processedValue !== `\`${initialValue}\``;
		const titleValue = processed ? this.chars.actingCharacter?.getString(`${templateKey}.template.title`) : undefined;
		const lines = processed ? processedValue.split(/[\r\n]/) : [];
		return {
			keys: matchKeys,
			title: titleValue,
			value: processed ? processedValue : undefined,
			lines
		};
	}

	protected _process(value: Optional<string>, options: ProcessOptions): string {
		if (!value) return "";
		const statBlockRegex = (this.constructor as typeof StatBlockProcessor).getStatBlockRegex();
		const parsers = {
			ticks: getCodeBlockRegex(),
			statBlock: statBlockRegex,
		};
		while (statBlockRegex.test(value)) {
			// tokens allow us better escape testing
			const tokens = tokenize(value, parsers);
			const values = tokens.map(({ key, token }) => {
				if (key === "statBlock") {
					const statBlock = this.parseStatBlock(token);
					let result: string | undefined;
					if (statBlock && !options.stack.includes(statBlock.stackValue)) {
						result = this.processStatBlock(statBlock, options);
					}
					return result ?? `\`${token}\``;
				}
				return token;
			});

			const joined = values.join("");

			// to avoid endless loops, break if nothing changed
			if (joined === value) break;

			// we changed, let's keep going
			value = joined;
		}
		return value;
	}

	protected getCharAndStatVal(statBlock: StatBlock, actingCharacter?: StatsCharacter): { char?:StatsCharacter; statVal?:string; } {
		const { aliasOrName, isAlt, isEmpty, isGM, isImplicit, isPC } = statBlock.char;

		const { chars } = this;

		let char: StatsCharacter | undefined;

		if (isEmpty || isImplicit) {
			char = actingCharacter ?? chars.actingCharacter;

		}if (isPC) {
			char = chars.primaryPlayerCharacter;

		}else if (isAlt) {
			// use statBlock.char.altType to differentiate between alt/companion/familiar/hireling
			char = chars.primaryCompanionCharacter;

		}else if (aliasOrName) {
			if (actingCharacter?.matches(aliasOrName)) {
				char = actingCharacter;
			}else if (chars.actingCharacter?.matches(aliasOrName)) {
				char = chars.actingCharacter;
			}else {
				char = chars.playerCharacters?.findByName(aliasOrName)
					?? chars.playerCharacters?.findCompanion(aliasOrName)
					?? chars.nonPlayerCharacters?.findByName(aliasOrName)
					?? chars.nonPlayerCharacters?.findCompanion(aliasOrName)
					?? chars.encounters?.findActiveChar(aliasOrName)
					?? chars.gmCharacters?.[0]?.companions?.findByName(aliasOrName)
					?? chars.gmCharacters?.[1]?.companions?.findByName(aliasOrName)
					?? undefined;
			}

		}

		const { statKey } = statBlock;

		let statVal: string | undefined;

		if (char) {
			// we have a character, get the stat
			statVal = char.getString(statKey);

		}else if (isGM) {
			// we didn't find a character, try the built in gmCharacters
			let gmChar = chars.gmCharacters?.[0];
			statVal = gmChar?.getString(statKey);
			if (statVal === undefined) {
				gmChar = chars.gmCharacters?.[1];
				statVal = gmChar?.getString(statKey);
			}
			char = gmChar;
		}

		return { char, statVal };
	}

	/** Parses the given value to see if it has a StatBlock */
	protected parseStatBlock(statBlock: Optional<string>): StatBlock | undefined {
		// make sure we have a usable value
		statBlock = statBlock?.trim();
		if (!statBlock) return undefined;

		const { implicit, charReference, statKey, defaultValue } = (this.constructor as typeof StatBlockProcessor).getStatBlockRegex().exec(statBlock)?.groups ?? {};
		if (!statKey) return undefined;

		const char = implicit ? { isImplicit:true } : this.parseCharReference(charReference);
		const stackValue = `${char.stackValue ?? ""}::${statKey}`.toLowerCase();

		return {
			char,
			statKey,
			defaultValue: defaultValue?.trim(),

			stackValue,
		};
	}

	protected processStatBlock(statBlock: StatBlock, { actingCharacter, matches, stack }: ProcessOptions): string | undefined {
		const { statKey, stackValue, defaultValue } = statBlock;

		const { char, statVal } = this.getCharAndStatVal(statBlock, actingCharacter);

		// process stat or default
		const statValue = statVal ?? defaultValue ?? "";
		if (char && statValue.length) {
			matches.add(statKey.toLowerCase());
			const processed = this._process(statValue, { actingCharacter:char, matches, stack:stack.concat([stackValue]) });

			const mathed = doStatMath(processed);
			if (mathed !== processed) return mathed;

			const wrapped = `(${processed})`;
			const wrappedAndMathed = doStatMath(wrapped);
			if (wrappedAndMathed !== wrapped) return wrappedAndMathed;

			return processed;
		}

		return undefined;
	}

	/** Returns the RegExp instance used to match a StatBlock. */
	public static getCharReferenceRegex = getCharReferenceRegex;
	public static getStatBlockRegex = getStatBlockRegex;
	// public static getStatBlockTestRegex = getStatBlockTestRegex;

	public clone(): StatBlockProcessor {
		return new StatBlockProcessor({ ...this.chars });
	}

	public for(char: StatsCharacter): StatBlockProcessor {
		if (this.chars.actingCharacter === char) return this;
		const clone = this.clone();
		clone.chars.actingCharacter = char;
		return clone;
	}

	public static for(char: StatsCharacter) {
		return new StatBlockProcessor({actingCharacter:char});
	}

	public static process(char: StatsCharacter, value: Optional<string>) {
		return StatBlockProcessor.for(char).processStatBlocks(value);
	}

	/** @todo merge this and process and processTemplate somehow .. maybe just use these args in those two */
	public static doIt({ char, processor, overrideTemplate, templateKey }: { char: StatsCharacter; processor?:StatBlockProcessor; overrideTemplate?:string; templateKey:string; }) {
		if (processor) {
			processor.for(char);
		}else {
			processor = this.for(char);
		}
		if (overrideTemplate) {
			return processor.processStatBlocks(overrideTemplate);
		}
		return processor.processTemplate(templateKey).value;
	}
}
