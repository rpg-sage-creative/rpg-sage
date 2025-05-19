import { isDate } from "util/types";

type Format =
	/** Relative Time: 0 seconds ago */
	"R"
	/** Long Date: March 5, 2020 */
	| "D"
	/** Short Date: 05/03/2020 */
	| "d"
	/** Long Time: 11:28:27 AM */
	| "T"
	/** Short Time: 11:28 AM */
	| "t"
	/** Long Date/Time: Thursday, March 5, 2020 11:28:27 AM */
	| "F"
	/** Short Date/Time: 5 March 2020 11:28 */
	| "f";

/** Creates a Discord formatted relative timestamp for the given Format. */
export function toDiscordDate(ts: number | Date, format: Format): string {
	ts = isDate(ts) ? ts.getTime() : ts;
	const unix = Math.floor(ts / 1000);
	return `<t:${unix}:${format}>`;
}