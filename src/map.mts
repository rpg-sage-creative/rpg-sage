import { captureProcessExit } from "./sage-utils/utils/ConsoleUtils/process";
import { RenderableMap } from "./sage-utils/utils/MapUtils";

captureProcessExit();
RenderableMap.startServer(3000);

// node --experimental-modules --es-module-specifier-resolution=node map.mjs
