import { info } from "../../console/loggers/info.js";

let _assertingLabel: string | null;

/** Starts labeling assert commands. */
export function startAsserting(label: string): void {
	stopAsserting();
	_assertingLabel = label ?? null;
	if (_assertingLabel) {
		info(`Testing: ${_assertingLabel} ...`);
	}
}

/** Stops labeling assert commands. */
export function stopAsserting(): void {
	if (_assertingLabel) {
		info(`Testing: ${_assertingLabel} ... done.`);
	}
	_assertingLabel = null;
}

/** Returns the label currently being asserted. */
export function getAssertLabel(): string | null {
	return _assertingLabel ?? null;
}