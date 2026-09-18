import type { DateLike } from "./DateLike.js";

/** Returns the day of the year (1-365) */
export function getDayOfYear(): number;

/** Returns the day of the year (1-365) */
export function getDayOfYear(date: DateLike): number;

export function getDayOfYear(dt: DateLike = new Date()): number {
	const oneJanDate = new Date(dt.getFullYear(), 0, 1);
	const dateOnly = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
	return Math.ceil((dateOnly.getTime() - oneJanDate.getTime()) / 86400000) + 1;
}
