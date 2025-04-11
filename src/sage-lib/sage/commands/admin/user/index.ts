import { registerAlias } from "./alias.js";
import { registerUser as _registerUser } from "./user.js";

export function registerUser(): void {
	registerAlias();
	_registerUser();
}
