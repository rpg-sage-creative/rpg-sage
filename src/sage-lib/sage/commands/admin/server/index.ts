import registerAdmin from "./admin";
import registerPrefix from "./prefix";
import registerRole from "./role";
import registerServer from "./server";

export default function register(): void {
	registerAdmin();
	registerPrefix();
	registerRole();
	registerServer();
}
