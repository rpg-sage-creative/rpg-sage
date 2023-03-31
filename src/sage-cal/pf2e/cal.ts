import { getDaysPerMonth } from "../../sage-utils/utils/DateUtils";

export enum Month { Abadius, Calistril, Pharast, Gozran, Desnus, Sarenith, Erastus, Arodus, Rova, Lamashan, Neth, Kuthona }
export enum Day { Sunday, Moonday, Toilday, Wealday, Oathday, Fireday, Starday }

/** Returns the number of days in the given month. */
export function getDaysInMonth(month: Month): number {
	// days per month are the same in Pathfinder as on Earth
	return getDaysPerMonth()[month];
}
