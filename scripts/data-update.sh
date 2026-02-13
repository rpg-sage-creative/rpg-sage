#!/bin/bash

WHICH="$1"

echo "Which: $WHICH"

pnpm data:reset -which "$WHICH"
pnpm data:process "$WHICH"
pnpm data:validate "$WHICH"
pnpm data:upload "$WHICH"
pnpm data:compare "$WHICH"
