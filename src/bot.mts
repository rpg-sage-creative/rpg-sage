import { initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { activate } from "./sage-lib/index.js";

initializeConsoleUtilsByEnvironment();
activate();

// node --experimental-modules --es-module-specifier-resolution=node bot.mjs
