import type { Optional } from "@rsc-utils/type-utils";
import GDate from "../../../sage-cal/pf2e/GDate";
import { DaysPerMonth, Days as GDays, Months } from "../../../sage-cal/pf2e/cal";
import SDate from "../../../sage-cal/sf1e/SDate";
import { Days as SDays } from "../../../sage-cal/sf1e/cal";
import type { RenderableContent } from "../../../sage-utils/utils/RenderUtils";
import { capitalize } from "@rsc-utils/string-utils";
import { registerInteractionListener } from "../../discord/handlers";
import type SageInteraction from "../model/SageInteraction";
import type SageMessage from "../model/SageMessage";
import { createCommandRenderableContent, registerCommandRegex } from "./cmd";
import { registerCommandHelp } from "./help";

function calcYearDelta(from: TYearOrigin, to: TYearOrigin): number {
	if (from === to) {
		return 0;
	}
	if (from === "Absalom") {
		if (to === "Golarion") {
			return Math.abs(SDate.YearDelta) + Math.abs(GDate.YearDelta);
		}
		// Earth
		return -SDate.YearDelta;
	}
	if (from === "Golarion") {
		if (to === "Absalom") {
			return -1 * (Math.abs(SDate.YearDelta) + Math.abs(GDate.YearDelta));
		}
		// Earth
		return -GDate.YearDelta;
	}
	// Earth
	return to === "Absalom" ? SDate.YearDelta : GDate.YearDelta;
}

type TYearOrigin = "Absalom" | "Earth" | "Golarion";
function getGDateOrToday(arg: Optional<string>, origin: TYearOrigin): GDate {
	if (arg) {
		const parts = arg.split(/\D/);
		if (arg.length === 10 && parts.length === 3) {
			const yearDelta = calcYearDelta(origin, "Earth");
			return new GDate(+parts[0] + yearDelta, +parts[1] - 1, +parts[2]);
		}
	}
	return new GDate();
}
function getSDateOrToday(arg: Optional<string>, origin: TYearOrigin): SDate {
	if (arg) {
		const parts = arg.split(/\D/);
		if (arg.length === 10 && parts.length === 3) {
			const yearDelta = calcYearDelta(origin, "Earth");
			return new SDate(+parts[0] + yearDelta, +parts[1] - 1, +parts[2]);
		}
	}
	return new SDate();
}

function _calDate(value?: Optional<string>, origin?: Optional<TYearOrigin>): RenderableContent {
	const gDate = getGDateOrToday(value, origin ?? "Earth");
	const sDate = getSDateOrToday(value, origin ?? "Earth");
	const content = createCommandRenderableContent();
	content.appendTitledSection(`<b>Today's Date (Earth)</b>`, gDate.toLongEarthString());
	content.appendTitledSection(`<b>Today's Date (Golarion)</b>`, gDate.toLongString());
	content.appendTitledSection(`<b>Today's Date (Absalom Station)</b>`, sDate.toLongString());
	content.appendTitledSection(`<b>Terrestrial Season (Northern Hemisphere)</b>`, `<b>Temperate</b> ${gDate.temperateSeason}`, `<b>Tropical</b> ${gDate.tropicalSeason}`);
	return content;
}
function calDate(sageMessage: SageMessage): Promise<void> {
	const date = sageMessage.args[0];
	const origin = capitalize(sageMessage.args[1]) as TYearOrigin;
	return sageMessage.send(_calDate(date, origin)) as Promise<any>;
}

function _calCalendar(): RenderableContent {
	const content = createCommandRenderableContent();
	content.appendTitledSection(`<b>Golarion's Days of the Week</b>`);
	content.append(GDays.join(", "));
	content.appendTitledSection(`<b>Absalom Station's Days of the Week</b>`);
	content.append(SDays.join(", "));
	content.appendTitledSection(`<b>Golarion's Months (# of Days)</b>`);
	content.append(Months.map((m, i) => `${String(i + 1)}. ${m} (${DaysPerMonth[i]})`).join(`, `));
	content.append(`<i>Absalom Station still uses these months.</i>`);
	return content;
}
function calCalendar(sageMessage: SageMessage): Promise<void> {
	return sageMessage.send(_calCalendar()) as Promise<any>;
}

//#region slash command

function slashTester(sageInteraction: SageInteraction): boolean {
	return sageInteraction.isCommand("Finder", "date")
		|| sageInteraction.isCommand("Finder", "calendar");
}

async function slashHandler(sageInteraction: SageInteraction): Promise<void> {
	if (sageInteraction.isCommand("Finder", "calendar")) {
		return sageInteraction.reply(_calCalendar(), false);
	}
	const date = sageInteraction.getString("date");
	const origin = sageInteraction.getString<TYearOrigin>("origin");
	return sageInteraction.reply(_calDate(date, origin), false);
}

//#endregion

export function registerCal(): void {
	registerCommandRegex(/^\s*(?:date|today)\s*(\d{4}\D\d{2}\D\d{2})?\s*(earth|absalom|golarion)?\s*$/i, calDate);
	registerCommandHelp("Command", "Golarion", "today");
	registerCommandHelp("Command", "Golarion", "date YYYY-MM-DD");

	registerCommandRegex(/^\s*cal(?:endar)?\s*$/i, calCalendar);
	registerCommandHelp("Command", "Golarion", "calendar");

	registerInteractionListener(slashTester, slashHandler);
}
