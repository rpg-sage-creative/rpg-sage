import { redactCodeBlocksTest } from "./dist/sage-utils/utils/StringUtils/redactCodeBlocks.js";
import XRegExp from "xregexp";

redactCodeBlocksTest();

// const regex = /((?<!\\)`)/;
// const tests = [" yes `redact` ", "not \\`redacted\\` "];
// tests.forEach(test=> {
// 	console.log(regex.exec(test))
// })
