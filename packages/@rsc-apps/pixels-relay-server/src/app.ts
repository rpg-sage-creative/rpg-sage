import { PixelsRelayServer } from "@rsc-sage/core";
import { captureProcessExit, getPort } from "@rsc-utils/core-utils";

captureProcessExit();
PixelsRelayServer.startServer(getPort("Pixels"));

// node --experimental-modules --es-module-specifier-resolution=node relay.mjs
