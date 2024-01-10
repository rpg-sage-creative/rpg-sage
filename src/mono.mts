import { activate } from "./sage-lib";
import { captureProcessExit } from "./sage-utils/utils/ConsoleUtils/process";
import { RenderableMap } from "./sage-utils/utils/MapUtils";

captureProcessExit();
RenderableMap.startServer(3000);
activate();

// node --experimental-modules --es-module-specifier-resolution=node mono.mjs
