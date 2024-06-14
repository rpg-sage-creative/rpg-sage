import { info } from "../../console/loggers/info.js";

let _assertingLabel: string | undefined;

/** Starts labeling assert commands. */
export function startAsserting(label: string): void {
	stopAsserting();
	_assertingLabel = label ?? undefined;
	if (_assertingLabel) {
		info(`Testing: ${_assertingLabel} ...`);
	}
}

/** Stops labeling assert commands. */
export function stopAsserting(): void {
	if (_assertingLabel) {
		info(`Testing: ${_assertingLabel} ... done.`);
	}
	_assertingLabel = undefined;
}

/** Returns the label currently being asserted. */
export function getAssertLabel(): string | undefined {
	return _assertingLabel ?? undefined;
}