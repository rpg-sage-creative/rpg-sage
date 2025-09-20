import { toMarkdown, type Optional } from "@rsc-utils/core-utils";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { DiceMacroBase } from "../../../model/Macro.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { StatMacroProcessor, type StatMacroCharacters } from "../../dice/stats/StatMacroProcessor.js";
import { MoveDirection } from "../../map/MoveDirection.js";
import { replaceCharacterMentions } from "./replaceCharacterMentions.js";
import { replaceTableMentions } from "./replaceTableMentions.js";

export type SyncDialogContentFormatter = (content: Optional<string>) => string;
export type AsyncDialogContentFormatter = (content: Optional<string>) => Promise<string>;

export class DialogProcessor<HasActingCharacter extends boolean = false> extends StatMacroProcessor {
	protected constructor(chars: StatMacroCharacters, macros: DiceMacroBase[], public sageCommand: SageCommand) {
		super(chars, macros);
	}

	public get actingCharacter(): HasActingCharacter extends true ? GameCharacter : GameCharacter | undefined {
		return this.chars.actingCharacter as GameCharacter;
	}

	public clone(): DialogProcessor {
		return new DialogProcessor({ ...this.chars } as StatMacroCharacters, this.macros.slice(), this.sageCommand);
	}

	public for(char: GameCharacter): DialogProcessor<true> {
		return super.for(char) as DialogProcessor<true>;
	}

	public getFormatter(withMentions: true):AsyncDialogContentFormatter;
	public getFormatter(withMentions?: false): SyncDialogContentFormatter;
	public getFormatter(withMentions?: boolean) {
		if (withMentions) return async (content: string) => this.processDialog(content);
		return (content: string) => this.processDialogWithoutMentions(content);
	}

	public processAuthorName(authorName?: string): HasActingCharacter extends true ? string : string | undefined {
		return this.actingCharacter?.toDisplayName({ processor:this, overrideTemplate:authorName }) as string;
	}

	public async processDialog(content: string): Promise<string> {
		// process character and table mentions
		content = await this.processMentions(content);

		// proccess content
		content = this.processDialogWithoutMentions(content);

		return content;
	}

	public processDialogWithoutMentions(content: string): string {
		//#region footer / sheet link
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
		//#endregion

		// process stats in content
		content = this.processStatBlocks(content);

		// process movement directions (belongs with SageEventCache.format() logic)
		content = MoveDirection.replaceAll(content, this.sageCommand.moveDirectionOutputType);

		//#region sage emoji and html to markdown are part of SageEventCache.format()

		// sage emoji
		content = this.sageCommand.eventCache.emojify(content);

		// convert html to markdown
		content = toMarkdown(content);

		//#endregion

		return content;
	}

	public async processMentions(content: string): Promise<string> {
		// process character mentions
		content = await replaceCharacterMentions(this.sageCommand, content);

		// process table mentions
		content = await replaceTableMentions(this.sageCommand, content);

		return content;
	}

	public static from(sageCommand: SageCommand): DialogProcessor {
		const { chars, macros } = StatMacroProcessor.from(sageCommand);
		return new DialogProcessor(chars as StatMacroCharacters, macros, sageCommand);
	}

}