import SDate from "../../../sage-cal/sf1e/SDate";
import { Days as GDays, Months, DaysPerMonth, GDate } from "../../../sage-pf2e";
import { Days as SDays } from "../../../sage-cal/sf1e/cal";
import type SageMessage from "../model/SageMessage";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp } from "./help";

function getGDateOrToday(arg: string): GDate {
	if (arg) {
		const parts = arg.split(/\D/);
		if (arg.length === 10 && parts.length === 3) {
			return new GDate(+parts[0], +parts[1] - 1, +parts[2]);
		}
	}
	return new GDate();
}
function getSDateOrToday(arg: string): SDate {
	if (arg) {
		const parts = arg.split(/\D/);
		if (arg.length === 10 && parts.length === 3) {
			return new SDate(+parts[0], +parts[1] - 1, +parts[2]);
		}
	}
	return new SDate();
}

async function calDate(sageMessage: SageMessage): Promise<void> {
	const gDate = getGDateOrToday(sageMessage.args[0]);
	const sDate = getSDateOrToday(sageMessage.args[0]);
	const content = createCommandRenderableContent();
	content.appendTitledSection(`<b>Today's Date (Earth)</b>`, gDate.toLongEarthString());
	content.appendTitledSection(`<b>Today's Date (Golarion)</b>`, gDate.toLongString());
	content.appendTitledSection(`<b>Today's Date (Absalom Station)</b>`, sDate.toLongString());
	content.appendTitledSection(`<b>Terrestrial Season (Northern Hemisphere)</b>`, `<b>Temperate</b> ${gDate.temperateSeason}`, `<b>Tropical</b> ${gDate.tropicalSeason}`);
	sageMessage.send(content);
}

async function calDays(sageMessage: SageMessage): Promise<void> {
	const content = createCommandRenderableContent();
	content.appendTitledSection(`<b>Golarion's Days of the Week</b>`);
	content.append(GDays.join(", "));
	content.appendTitledSection(`<b>Absalom Station's Days of the Week</b>`);
	content.append(SDays.join(", "));
	sageMessage.send(content);
}

async function calMonths(sageMessage: SageMessage): Promise<void> {
	const content = createCommandRenderableContent();
	content.setTitle(`<b>Golarion's Months (# of Days)</b>`);
	content.append(Months.map((m, i) => `${String(i + 1)}. ${m} (${DaysPerMonth[i]})`).join(`, `));
	content.append(`<i>Absalom Station still uses these months.</i>`);
	sageMessage.send(content);
}

export default function register(): void {
	registerCommandRegex(/^\s*(?:date|today)\s*(\d{4}\D\d{2}\D\d{2})?\s*$/i, calDate);
	registerCommandHelp("Command", "Golarion", "today");
	registerCommandHelp("Command", "Golarion", "date YYYY-MM-DD");

	registerCommandRegex(/^\s*days\s*$/i, calDays);
	registerCommandHelp("Command", "Golarion", "days");

	registerCommandRegex(/^\s*months\s*$/i, calMonths);
	registerCommandHelp("Command", "Golarion", "months");
}
