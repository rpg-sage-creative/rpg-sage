import type { Optional } from "@rsc-utils/core-utils";
import type { GuildMember } from "discord.js";
import type { Game } from "../../../model/Game.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { DiceMacroBase } from "../../../model/Macro.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { User } from "../../../model/User.js";
import { StatMacroProcessor, type StatMacroCharacters } from "../../dice/stats/StatMacroProcessor.js";
import { replaceCharacterMentions } from "./replaceCharacterMentions.js";
import { replaceTableMentions } from "./replaceTableMentions.js";

type MentionArgs = {
	game?: Game;
	gameMasters?: GuildMember[];
	players?: GuildMember[];
	mentionPrefix?: string;
	sageUser: User;
};

type ProcessArgs = {
	basic?: boolean;
	footer?: boolean;
	mentions?: boolean;
	skipBrackets?: boolean;
	sorts?: boolean;
	stats?: boolean;
};

const SortTagRegExp = /<sort(\s[^\]]+)?\s*>((.|\n)*?)<\/sort>/i;
const SortTagRegExpG = new RegExp(SortTagRegExp, "gi");
// const LineParseRegExp = regex()`
// 	^
// 	(?<num>
// 		\g<number>
// 		|
// 		\|\| \s* \g<number> \s* \|\|
// 	)
// 	\s+
// 	(?<val>
// 		.*?
// 	)
// 	$

// 	(?(DEFINE)
// 		(?<number> [\-\+−]? \d+ (\.\d+)? )
// 	)
// `;
const LineParseRegExp = /^(?<num>(?:[\-\+−]?\d+(?:\.\d+)?)|\|\|\s*(?:[\-\+−]?\d+(?:\.\d+)?)\s*\|\|)\s+(?<val>.*?)$/v;

type Line = { line:string; num?:number; spoiler?:boolean; val?:string; };
function parseSortLine(line: string): Line | undefined {
	line = line.trim();
	if (!line) return undefined;
	const groups = LineParseRegExp.exec(line)?.groups;
	if (groups) {
		let { num, val } = groups;
		const spoiler = num.startsWith("||");
		if (spoiler) num = num.slice(2, -2).trim();
		if (num.startsWith("−")) num = "-" + num.slice(1);
		return { line:`${num} ${val}`, num:+num, spoiler, val };
	}
	return { line };
}

function sortLineSorter(a: Line, b: Line, one: 1 | -1): number {
	if (a.num === undefined) return -1;
	else if (b.num === undefined) return 1;
	if (a.num < b.num) return one;
	if (a.num > b.num) return -one;
	if (a.val! < b.val!) return one;
	if (a.val! > b.val!) return -one;
	if (a.line < b.line) return one;
	if (a.line > b.line) return -one;
	return 0;
}

export class DialogProcessor<HasActingCharacter extends boolean = false> extends StatMacroProcessor {
	protected constructor(chars: StatMacroCharacters, macros: DiceMacroBase[], public sageCommand: SageCommand, public mentionArgs: MentionArgs) {
		super(chars, macros);
	}

	public get actingCharacter(): HasActingCharacter extends true ? GameCharacter : GameCharacter | undefined {
		return this.chars.actingCharacter as GameCharacter;
	}

	public clone(): DialogProcessor {
		return new DialogProcessor({ ...this.chars } as StatMacroCharacters, this.macros.slice(), this.sageCommand, { ...this.mentionArgs });
	}

	public for(char: GameCharacter): DialogProcessor<true> {
		return super.for(char) as DialogProcessor<true>;
	}

	public getFormatter(args: ProcessArgs) {
		return (content: Optional<string>) => this.process(content, args);
	}

	/** processesses only the acting character's toDisplayName */
	public processDisplayName(authorName?: string): HasActingCharacter extends true ? string : string | undefined {
		return this.actingCharacter?.toDisplayName({ processor:this, overrideTemplate:authorName }) as string;
	}

	public process(content: Optional<string>, { basic, footer, mentions, skipBrackets, sorts, stats }: ProcessArgs): string {
		if (!content) return "";

		// footer can have stats, do it before stats
		if (footer) {
			content = this.processFooter(content);
		}

		// might have emoji in stats, do it before basic
		if (stats) {
			content = this.processStatBlocks(content, { skipBrackets });
		}

		// this shouldn't have anything that needs processing ...
		if (mentions) {
			content = this.processMentions(content);
		}

		if (sorts) {
			content = this.processSorts(content);
		}

		// this is the last to go
		if (basic) {
			content = this.processBasic(content);
		}

		return content.trim();
	}

	/** processes basic replacement used in all sage posts: sage custom emoji tags and html to markdown */
	public processBasic(content: Optional<string>): string {
		if (!content) return "";

		content = this.sageCommand.eventCache.format(content);

		return content.trim();
	}

	protected processSorts(content: Optional<string>): string {
		if (!content) return "";

		return content.replace(SortTagRegExpG, (_, dir: string | undefined, inner: string) => {
			const sortOne = dir?.toLowerCase().includes("asc") ? -1 : 1;
			const lines = inner.split("\n").map(parseSortLine).filter((line?: Line): line is Line => !!line);
			lines.sort((a, b) => sortLineSorter(a, b, sortOne));
			return lines.map(({ line }) => line).join("\n");
		});
	}

	public processFooter(content: Optional<string>): string {
		if (!content) return "";

		let dialogFooter = this.actingCharacter?.toDialogFooterLine({ processor:this });

		const sheetLink = this.actingCharacter?.toSheetLink();
		if (sheetLink) {
			if (dialogFooter) {
				if (!dialogFooter.includes(sheetLink.slice(5, -2))) {
					dialogFooter += ` ${sheetLink}`;
				}
			}else if (!content.includes(sheetLink)) {
				content += ` ${sheetLink}`;
			}
		}

		if (dialogFooter && !content.includes(dialogFooter)) {
			content += `\n${dialogFooter}`;
		}

		return content.trim();
	}

	public processMentions(content: Optional<string>): string {
		if (!content) return "";

		// process character mentions
		content = replaceCharacterMentions(content, this.mentionArgs);

		// process table mentions
		content = replaceTableMentions(content, this.mentionArgs);

		return content.trim();
	}

	public static async forDialog(sageCommand: SageCommand): Promise<DialogProcessor>;
	public static async forDialog(sageCommand: SageCommand, char: GameCharacter): Promise<DialogProcessor<true>>;
	public static async forDialog(sageCommand: SageCommand, char?: GameCharacter): Promise<DialogProcessor<boolean>> {
		const { chars, macros } = StatMacroProcessor.withMacros(sageCommand);
		const { game, mentionPrefix, sageUser } = sageCommand;
		const gameMasters = await game?.gmGuildMembers();
		const players = await game?.pGuildMembers();
		const mentionArgs = { game, gameMasters, players, mentionPrefix, sageUser };
		const processor = new DialogProcessor(chars as StatMacroCharacters, macros, sageCommand, mentionArgs);
		if (char) {
			return processor.for(char);
		}
		return processor;
	}

}