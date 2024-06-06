import type { Optional } from "@rsc-utils/core-utils";
import { GDate } from "../../../sage-cal/pf2e/GDate.js";
import { DaysPerMonth, Days as GDays, Months } from "../../../sage-cal/pf2e/cal.js";
import { SDate } from "../../../sage-cal/sf1e/SDate.js";
import { Days as SDays } from "../../../sage-cal/sf1e/cal.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { SageCommand } from "../model/SageCommand.js";
import { createCommandRenderableContent } from "./cmd.js";

function calcYearDelta(from: TYearOrigin, to: TYearOrigin): number {
	if (from === to) {
		return 0;
	}
	if (from === "Absalom Station") {
		if (to === "Golarion") {
			return Math.abs(SDate.YearDelta) + Math.abs(GDate.YearDelta);
		}
		// Earth
		return -SDate.YearDelta;
	}
	if (from === "Golarion") {
		if (to === "Absalom Station") {
			return -1 * (Math.abs(SDate.YearDelta) + Math.abs(GDate.YearDelta));
		}
		// Earth
		return -GDate.YearDelta;
	}
	// Earth
	return to === "Absalom Station" ? SDate.YearDelta : GDate.YearDelta;
}

type TYearOrigin = "Absalom Station" | "Earth" | "Golarion";
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


//#region slash command

async function calendarHandler(sageCommand: SageCommand): Promise<void> {
	const content = createCommandRenderableContent();
	content.appendTitledSection(`<b>Golarion's Days of the Week</b>`);
	content.append(GDays.join(", "));
	content.appendTitledSection(`<b>Absalom Station's Days of the Week</b>`);
	content.append(SDays.join(", "));
	content.appendTitledSection(`<b>Golarion's Months (# of Days)</b>`);
	content.append(Months.map((m, i) => `${String(i + 1)}. ${m} (${DaysPerMonth[i]})`).join(`, `));
	content.append(`<i>Absalom Station still uses these months.</i>`);
	return sageCommand.reply(content, false);
}

function parseOrigin(value?: string | null): TYearOrigin | undefined {
	if (value) {
		if (/^absalom/i.test(value)) return "Absalom Station"; //NOSONAR
		if (/earth/i.test(value)) return "Earth"; //NOSONAR
		if (/golarion/i.test(value)) return "Golarion"; //NOSONAR
	}
	return undefined;
}

async function dateHandler(sageCommand: SageCommand): Promise<void> {
	const date = sageCommand.args.getString("date");
	const origin = parseOrigin(sageCommand.args.getString("origin"));
	const gDate = getGDateOrToday(date, origin ?? "Earth");
	const sDate = getSDateOrToday(date, origin ?? "Earth");
	const content = createCommandRenderableContent();
	content.appendTitledSection(`<b>Today's Date (Earth)</b>`, gDate.toLongEarthString());
	content.appendTitledSection(`<b>Today's Date (Golarion)</b>`, gDate.toLongString());
	content.appendTitledSection(`<b>Today's Date (Absalom Station)</b>`, sDate.toLongString());
	content.appendTitledSection(`<b>Terrestrial Season (Northern Hemisphere)</b>`, `<b>Temperate</b> ${gDate.temperateSeason}`, `<b>Tropical</b> ${gDate.tropicalSeason}`);
	return sageCommand.reply(content, false);
}

//#endregion

export function registerCal(): void {
	registerListeners({ commands:["Finder|calendar", "Finder|cal"], interaction:calendarHandler, message:calendarHandler });
	registerListeners({ commands:["Finder|date", "Finder|today"], interaction:dateHandler, message:dateHandler });
}
