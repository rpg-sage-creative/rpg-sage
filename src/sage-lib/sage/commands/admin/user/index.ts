import { register as registerAlias } from "./alias";
import { register as registerMacro } from "./macro";
import { register as registerUser } from "./user";

export function register(): void {
	registerAlias();
	registerMacro();
	registerUser();
}
