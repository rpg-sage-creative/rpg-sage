import { getPort } from "@rsc-sage/env";
import { captureProcessExit } from "@rsc-utils/core-utils";
import { RenderableMap } from "@rsc-utils/map-utils";

captureProcessExit();
RenderableMap.startServer(getPort("Map"));

// node --experimental-modules --es-module-specifier-resolution=node map.mjs
