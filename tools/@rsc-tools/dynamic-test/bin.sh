
function runTest() {
	# we scrub the logs before every test
	pnpm scrub::logs
	# pass the test file to vitest
	pnpm vitest --run --globals "$1"
	# exit successfully so we stop trying to process the file
	exit 0
}

FILE="$1"

# we can run tests against .test.js files
[ "${FILE#*.}" == "test.js" ] && [ -f "$FILE" ] && runTest "$FILE"

# we can run tests against .test.ts files
[ "${FILE#*.}" == "test.ts" ] && [ -f "$FILE" ] && runTest "$FILE"

# We can test .ts files in /src/ by looking for a .test.ts file in /test/
TEST_TS_FILE="$(echo $FILE | sed s/\\\/src\\\//\\\/test\\\// | sed s/\\\.ts/\\\.test\\\.ts/)"
[ -f "$TEST_TS_FILE" ] && pnpm build && runTest "$TEST_TS_FILE"

# We can test .ts files in /src/ by looking for a .test.js file in /test/
TEST_JS_FILE="$(echo $FILE | sed s/\\\/src\\\//\\\/test\\\// | sed s/\\\.ts/\\\.test\\\.js/)"
[ -f "$TEST_JS_FILE" ] && pnpm build && runTest "$TEST_JS_FILE"

echo "Test File Not Found: $FILE"
