import { captureProcessExit } from "@rsc-utils/console-utils";
import { activate } from "./sage-lib";

captureProcessExit();
activate();

// node --experimental-modules --es-module-specifier-resolution=node bot.mjs
