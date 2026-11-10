import { getPort } from "@rsc-sage/env";
import { RenderableMap } from "@rsc-sage/map";
import { captureProcessExit } from "@rsc-utils/logger-utils";

captureProcessExit();
RenderableMap.startServer(getPort("Map"));

// node --experimental-modules --es-module-specifier-resolution=node map.mjs
