import { activate } from "./sage-lib";
import { captureProcessExit } from "./sage-utils/utils/ConsoleUtils";
import { getPort } from "./sage-utils/utils/EnvUtils";
import { RenderableMap } from "./sage-utils/utils/MapUtils";

captureProcessExit();
RenderableMap.startServer(getPort("Map"));
activate();

// node --experimental-modules --es-module-specifier-resolution=node mono.mjs
