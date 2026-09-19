# We test .ts files in /src/ by looking for a .test.ts or .test.js file in /test/

FILE="$1"

TEST_TS_FILE="$(echo $FILE | sed s/\\\/src\\\//\\\/test\\\// | sed s/\\\.ts/\\\.test\\\.ts/)"
[ -f "$TEST_TS_FILE" ] && pnpm test:dot-test-dot-ts "$TEST_TS_FILE" && exit 0

TEST_JS_FILE="$(echo $FILE | sed s/\\\/src\\\//\\\/test\\\// | sed s/\\\.ts/\\\.test\\\.js/)"
[ -f "$TEST_JS_FILE" ] && pnpm test:dot-test-dot-js "$TEST_JS_FILE" && exit 0

echo "Test File Not Found: $FILE"
