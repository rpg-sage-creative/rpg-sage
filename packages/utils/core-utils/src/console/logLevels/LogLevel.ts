export enum LogLevel {
	error = 0,
	warn = 1,
	info = 2,
	http = 3,
	verbose = 4,
	debug = 5,
	silly = 6
}

export type LogLevelName = keyof typeof LogLevel;
