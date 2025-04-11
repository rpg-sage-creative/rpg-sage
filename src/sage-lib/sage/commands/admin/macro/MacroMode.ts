import type { MessageActionRowComponent } from "discord.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { parseCustomId, type MacroActionKey } from "./customId.js";

type ROLL = "🎲";
type EDIT = "⚙️";
type OTHER = "ℹ️";
type Emoji = ROLL | EDIT | OTHER;

export type Mode = "roll" | "edit" | "other";

export type ModeActionKey = MacroActionKey & ("showRollButtons" | "showEditButtons" | "showOtherButtons");

export class MacroMode {

	public readonly action: ModeActionKey;
	public readonly emoji: Emoji;
	public readonly mode: Mode;

	public constructor(mode: Emoji | Mode | ModeActionKey) {
		switch(mode) {
			case "showEditButtons":
			case "edit":
			case "⚙️":
				this.action = "showEditButtons";
				this.emoji = "⚙️";
				this.mode = "edit";
				break;
			case "showOtherButtons":
			case "other":
			case "ℹ️":
				this.action = "showOtherButtons";
				this.emoji = "ℹ️";
				this.mode = "other";
				break;
			default:
				this.action = "showRollButtons";
				this.emoji = "🎲";
				this.mode = "roll";
				break;
		}
	}

	public next(): MacroMode {
		switch(this.mode) {
			case "edit": return new MacroMode("other");
			case "other": return new MacroMode("roll");
			case "roll": return new MacroMode("edit");
		}
	}

	public static readonly ROLL: ROLL = "🎲";
	public static readonly EDIT: EDIT = "⚙️";
	public static readonly OTHER: OTHER = "ℹ️";

	public static action(value: Emoji | Mode | ModeActionKey): ModeActionKey {
		return new MacroMode(value).action;
	}

	public static emoji(value: Emoji | Mode | ModeActionKey): Emoji {
		return new MacroMode(value).emoji;
	}

	public static mode(value: Emoji | Mode | ModeActionKey): Mode {
		return new MacroMode(value).mode;
	}

	public static next(value: Emoji | Mode | ModeActionKey): MacroMode {
		return new MacroMode(value).next();
	}

	public static async from(sageCommand: SageCommand): Promise<MacroMode> {
		const message = await sageCommand.fetchMessage();
		const { components } = message ?? {};
		if (components?.length) {
			const modeActions: ModeActionKey[] = ["showRollButtons", "showEditButtons", "showOtherButtons"];
			const checkAction = (component: MessageActionRowComponent) => {
				const customIdArgs = component.customId ? parseCustomId(component.customId) : undefined;
				const action = customIdArgs ? modeActions.find(action => customIdArgs.action === action) : undefined;
				const isToggleAction = action && sageCommand.isSageInteraction("BUTTON") ? sageCommand.interaction.customId === component.customId : false;
				return { action, isToggleAction };
			};
			for (const row of components) {
				for (const component of row.components) {
					const { action, isToggleAction } = checkAction(component);
					if (action) {
						if (isToggleAction) {
							return new MacroMode(action);
						}else {
							return MacroMode.next(action);
						}
					}
				}
			}
		}
		// return sageCommand.args.getString("mode") ?? undefined;
		return new MacroMode("roll");
	}
}