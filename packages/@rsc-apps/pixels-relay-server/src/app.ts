import { PixelsRelayServer } from "@rsc-sage/core";
import { getPort } from "@rsc-sage/env";
import { captureProcessExit } from "@rsc-utils/logger-utils";
captureProcessExit();
PixelsRelayServer.startServer(getPort("Pixels"));

// node --experimental-modules --es-module-specifier-resolution=node relay.mjs
