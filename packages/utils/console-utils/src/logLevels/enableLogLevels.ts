import { enableLogLevel } from "./enableLogLevel.js";

type EnvironmentName = "development" | "test" | "production";

/**
 * Enables the given log levels to actually write to logging.
 * RSC default levels (development): enableLogLevel("silly", "debug", "verbose", "http", "info", "warn", "error").
 * RSC default levels (test): enableLogLevel("verbose", "http", "info", "warn", "error").
 * RSC default levels (production): enableLogLevel("info", "warn", "error").
 */
export function enableLogLevels(env: EnvironmentName): void {
	switch(env) {
		case "development":
			enableLogLevel("silly", "debug", "verbose", "http", "info", "warn", "error");
			break;
		case "test":
			enableLogLevel("verbose", "http", "info", "warn", "error");
			break;
		case "production":
			enableLogLevel("info", "warn", "error");
			break;
	}
}