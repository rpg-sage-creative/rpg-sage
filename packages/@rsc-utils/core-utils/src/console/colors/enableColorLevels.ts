import { enableColorLevel } from "./enableColorLevel.js";

type EnvironmentName = "development" | "test" | "production";

/**
 * Enables the given log levels to actually write with color.
 * RSC default levels (development): enableColorLevel("silly", "debug", "verbose", "http", "info", "warn", "error").
 * RSC default levels (test): enableColorLevel("verbose", "http", "info", "warn", "error").
 * RSC default levels (production): enableColorLevel("info", "warn", "error").
 */
export function enableColorLevels(env: EnvironmentName): void {
	switch(env) {
		case "development":
			enableColorLevel("silly", "debug", "verbose", "http", "info", "warn", "error");
			break;
		case "test":
			enableColorLevel("verbose", "http", "info", "warn", "error");
			break;
		case "production":
			enableColorLevel("info", "warn", "error");
			break;
	}
}