import * as _XRegExp from "xregexp";
const XRegExp: typeof _XRegExp = (_XRegExp as any).default;

/** Convenience for XRegExp.escape(value). */
export function escapeForRegExp(value: string): string {
	return XRegExp.escape(value);
}
