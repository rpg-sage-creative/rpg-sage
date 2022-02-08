import registerAlias from "./alias";
import registerMacro from "./macro";
import registerUser from "./user";

export default function register(): void {
	registerAlias();
	registerMacro();
	registerUser();
}
