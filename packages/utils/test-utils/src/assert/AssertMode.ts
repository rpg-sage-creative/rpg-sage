export type AssertMode = "pass" | "fail" | "both";

let _assertMode: AssertMode;

export function getAssertMode(): AssertMode {
	return _assertMode ?? "fail";
}

export function setAssertMode(mode: AssertMode): void {
	_assertMode = mode;
}