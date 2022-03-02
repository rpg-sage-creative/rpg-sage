// import * as fs from "fs";
import activate from "./sage-lib";

type TBot = "dev" | "beta" | "stable";

const args = process.argv.slice(2),
	botCodeName = ["dev","beta","stable"].find(s => args.includes(s)) as TBot ?? "dev",
	pf2DataPath = "./data/pf2e";

// const appNames = ["sage-bot", "sage-utils", "sage-data-pf2e", "sage-dice", "sage-lib-pf2e", "sage-lib"];
// const versions = appNames.map(appName => {
// 	if (appName === "sage-data-pf2e") {
// 		try {
// 			return String(fs.readFileSync(`${pf2DataPath}/dist/${appName}.ver`));
// 		}catch(ex) {
// 			return String(fs.readFileSync(`${pf2DataPath}/src/${appName}.ver`));
// 		}
// 	}
// 	return String(fs.readFileSync(`${appName}.ver`));
// });

const includePf2ToolsData = false;
activate(pf2DataPath, botCodeName, "rpg-sage\n0.0.0", includePf2ToolsData);

// node --experimental-modules --es-module-specifier-resolution=node app.mjs
