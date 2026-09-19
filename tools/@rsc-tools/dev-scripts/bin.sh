#!/bin/bash

# echo "The script you are running has:"
# echo "basename: [$(basename "$0")]"
# echo "dirname : [$(dirname "$0")]"
# echo "pwd     : [$(pwd)]"

JS_PATH="$(dirname "$0")/build"

WHICH="$1"
# echo "WHICH=$WHICH"

FLAG="$2"
# echo "FLAG=$FLAG"

if [ "$WHICH" == "create-indexes" ]; then
	node "$JS_PATH/createIndexes.js" "$@"

elif [ "$WHICH" == "create-test-todos" ]; then
	node "$JS_PATH/createTestTodos.js" "$@"

elif [ "$WHICH" == "deploy" ]; then
	node "$JS_PATH/deploy.js" "$@"

elif [ "$WHICH" == "write-env-json" ]; then
	node "$JS_PATH/writeEnvJson.js" "$@"

else
	echo "dev-scripts usage:"
	echo "    pnpm dev-scripts create-indexes"
	echo "    pnpm dev-scripts create-test-todos"
	echo "    pnpm dev-scripts deploy"
	echo "    pnpm dev-scripts write-env-json"
fi
