
export interface DateLike {
	getFullYear(): number;
	getMonth(): number;
	getDate(): number;

	getHours(): number;
	getMinutes(): number;
	getSeconds(): number;
	getMilliseconds(): number;

	getTime(): number;
}
