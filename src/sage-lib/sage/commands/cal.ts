import SDate from "../../../sage-cal/sf1e/SDate";
import { Days as GDays, Months, DaysPerMonth, GDate } from "../../../sage-pf2e";
import { Days as SDays } from "../../../sage-cal/sf1e/cal";
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
function getSDateOrToday(arg: Optional<string>): SDate {
	if (arg) {
		const parts = arg.split(/\D/);
		if (arg.length === 10 && parts.length === 3) {
			return new SDate(+parts[0], +parts[1] - 1, +parts[2]);
		}
	}
	return new SDate();
}

function _calDate(value?: Optional<string>): RenderableContent {
	const gDate = getGDateOrToday(value);
	const sDate = getSDateOrToday(value);
	const content = createCommandRenderableContent();
	content.appendTitledSection(`<b>Today's Date (Earth)</b>`, gDate.toLongEarthString());
	content.appendTitledSection(`<b>Today's Date (Golarion)</b>`, gDate.toLongString());
	content.appendTitledSection(`<b>Today's Date (Absalom Station)</b>`, sDate.toLongString());
	content.appendTitledSection(`<b>Terrestrial Season (Northern Hemisphere)</b>`, `<b>Temperate</b> ${gDate.temperateSeason}`, `<b>Tropical</b> ${gDate.tropicalSeason}`);
	return content;
}
async function calDate(sageMessage: SageMessage): Promise<void> {
	return sageMessage.send(_calDate(sageMessage.args[0])) as Promise<any>;
}

function _calDays(): RenderableContent {
	const content = createCommandRenderableContent();
	content.appendTitledSection(`<b>Golarion's Days of the Week</b>`);
	content.append(GDays.join(", "));
	content.appendTitledSection(`<b>Absalom Station's Days of the Week</b>`);
	content.append(SDays.join(", "));
	return content;
}
function calDays(sageMessage: SageMessage): Promise<void> {
	return sageMessage.send(_calDays()) as Promise<any>;
}

function _calMonths(): RenderableContent {
	const content = createCommandRenderableContent();
	content.setTitle(`<b>Golarion's Months (# of Days)</b>`);
	content.append(Months.map((m, i) => `${String(i + 1)}. ${m} (${DaysPerMonth[i]})`).join(`, `));
	content.append(`<i>Absalom Station still uses these months.</i>`);
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

export function calCommands(): TSlashCommand[] {
	return [
		{
			name: "Date",
			description: "Show today (or a specific day) for X-finder Games",
			options: [
				{ "name":"date", "description":"A specific date: yyy-mm-dd" }
			]
		},
		{
			name: "Days",
			description: "Days of the week for X-finder Games"
		},
		{
			name: "Months",
			description: "Months of the year for X-finder Games"
		}
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
