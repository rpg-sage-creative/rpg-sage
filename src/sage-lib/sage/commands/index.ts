import registerAdmin from "./admin";
import registerCal from "./cal";
import registerCmd from "./cmd";
import registerDcs from "./dcs";
import registerDefault from "./default";
import registerDialog from "./dialog";
import registerDice from "./dice";
import registerHelp from "./help";
import registerPathbuilder from "./pathbuilder";
import registerPfs from "./pfs";
import registerSpells from "./spells"
import registerWealth from "./wealth";
import registerWeather from "./weather";

export default function register(): void {
	registerAdmin();
	registerCal();
	registerCmd();
	registerDcs();
	registerDefault();
	registerDialog();
	registerDice();
	registerHelp();
	registerPathbuilder();
	registerPfs();
	registerSpells();
	registerWealth();
	registerWeather();
}
