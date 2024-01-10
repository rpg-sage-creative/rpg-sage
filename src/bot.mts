import { activate } from "./sage-lib";
import { captureProcessExit } from "./sage-utils/utils/ConsoleUtils";

captureProcessExit();
activate();

// node --experimental-modules --es-module-specifier-resolution=node bot.mjs
