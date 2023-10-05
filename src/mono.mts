// import * as fs from "fs";
import { activate } from "./sage-lib";
import { setEnv } from "./sage-utils/utils/ConsoleUtils";
import { captureProcessExit } from "./sage-utils/utils/ConsoleUtils/process";
import { RenderableMap } from "./sage-utils/utils/MapUtils";

type TBot = "dev" | "beta" | "stable";

const args = process.argv.slice(2),
	botCodeName = ["dev","beta","stable"].find(s => args.includes(s)) as TBot ?? "dev",
	pf2DataPath = "./data/pf2e";

captureProcessExit();
setEnv(botCodeName);
RenderableMap.startServer(3000);
activate(pf2DataPath, botCodeName, "rpg-sage\n0.0.0");

// node --experimental-modules --es-module-specifier-resolution=node app.mjs
