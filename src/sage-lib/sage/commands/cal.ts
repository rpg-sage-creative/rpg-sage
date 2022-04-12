import { Days, Months, DaysPerMonth, GDate } from "../../../sage-pf2e";
import type { Optional } from "../../../sage-utils";
import type { RenderableContent } from "../../../sage-utils/utils/RenderUtils";
import type { TSlashCommand } from "../../../types";
import { registerInteractionListener } from "../../discord/handlers";
import type SageInteraction from "../model/SageInteraction";
import type SageMessage from "../model/SageMessage";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp } from "./help";

function getGDateOrToday(arg: Optional<string>): GDate {
	if (arg) {
		const parts = arg.split(/\D/);
		if (arg.length === 10 && parts.length === 3) {
			return new GDate(+parts[0], +parts[1] - 1, +parts[2]);
		}
	}
	return new GDate();
}

function _calDate(value?: Optional<string>): RenderableContent {
	const gDate = getGDateOrToday(value);
	const content = createCommandRenderableContent();
	content.appendTitledSection(`<b>Today's Date (Golarion)</b>`, gDate.toLongString());
	content.appendTitledSection(`<b>Today's Date (Earth)</b>`, gDate.toLongEarthString());
	content.appendTitledSection(`<b>Temperate Season (Northern Hemisphere)</b>`, gDate.temperateSeason);
	content.appendTitledSection(`<b>Tropical Season (Northern Hemisphere)</b>`, gDate.tropicalSeason);
	return content;
}
async function calDate(sageMessage: SageMessage): Promise<void> {
	return sageMessage.send(_calDate(sageMessage.args[0])) as Promise<any>;
}

function _calDays(): RenderableContent {
	const content = createCommandRenderableContent();
	content.setTitle(`<b>Golarion's Days of the Week</b>`);
	content.append(Days.join(", "));
	return content;
}
function calDays(sageMessage: SageMessage): Promise<void> {
	return sageMessage.send(_calDays()) as Promise<any>;
}

function _calMonths(): RenderableContent {
	const content = createCommandRenderableContent();
	content.setTitle(`<b>Golarion's Months (# of Days)</b>`);
	content.append(Months.map((m, i) => `${String(i + 1)}. ${m} (${DaysPerMonth[i]})`).join(`, `));
	return content;
}
function calMonths(sageMessage: SageMessage): Promise<void> {
	return sageMessage.send(_calMonths()) as Promise<any>;
}

//#region slash command

function slashTester(sageInteraction: SageInteraction): boolean {
	return sageInteraction.isCommand("date")
		|| sageInteraction.isCommand("days")
		|| sageInteraction.isCommand("months");
}

async function slashHandler(sageInteraction: SageInteraction): Promise<void> {
	if (sageInteraction.isCommand("months")) {
		return sageInteraction.reply(_calMonths());
	}
	if (sageInteraction.isCommand("days")) {
		return sageInteraction.reply(_calDays());
	}
	const date = sageInteraction.getString("date");
	return sageInteraction.reply(_calDate(date));
}

function dateCommand(): TSlashCommand {
	return {
		name: "Date",
		description: "Show today (or a specific day) for X-finder Games",
		options: [
			{ "name":"date", "description":"A specific date: yyy-mm-dd" }
		]
	};
}
function daysCommand(): TSlashCommand {
	return {
		name: "Days",
		description: "Days of the week for X-finder Games"
	};
}
function monthsCommand(): TSlashCommand {
	return {
		name: "Months",
		description: "Months of the year for X-finder Games"
	};
}
export function calCommands(): TSlashCommand[] {
	return [
		dateCommand(),
		daysCommand(),
		monthsCommand()
	];
}

//#endregion

export default function register(): void {
	registerCommandRegex(/^\s*(?:date|today)\s*(\d{4}\D\d{2}\D\d{2})?\s*$/i, calDate);
	registerCommandHelp("Command", "Golarion", "today");
	registerCommandHelp("Command", "Golarion", "date YYYY-MM-DD");

	registerCommandRegex(/^\s*days\s*$/i, calDays);
	registerCommandHelp("Command", "Golarion", "days");

	registerCommandRegex(/^\s*months\s*$/i, calMonths);
	registerCommandHelp("Command", "Golarion", "months");

	registerInteractionListener(slashTester, slashHandler);
}
