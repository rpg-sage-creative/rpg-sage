import { registerAlias } from "./alias.js";
import { registerMacro } from "./macro.js";
import { registerUser as _registerUser } from "./user.js";

export function registerUser(): void {
	registerAlias();
	registerMacro();
	_registerUser();
}
