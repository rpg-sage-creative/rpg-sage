// import { debug, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
// import { macroToDice } from "../build/sage-lib/sage/commands/dice/macroToDice.js";

// initializeConsoleUtilsByEnvironment();

// async function main() {
// 	const macros = [[
// 		{ name:"acInner", dice:"[1d20 +{0} ac {ac}; {fire:0} fire +{ice} ice][acBottom]", category:"Uncategorized" },
// 		{ name:"acOuter", dice:"[acInner {ac}]" },
// 		{ name:"acBottom", dice:"[1d20+{0:0}{ac}]" },
// 	]];
// 	const tests = [
// 		`[acouter]`,
// 		`[acouter ac=10]`,
// 		`[acouter ac="10"]`,
// 		`[acouter fire="1d6"]`,
// 		`[acouter ice="1d6"]`,
// 		`[acouter fire=1d3 ice="1d4"]`,
// 	];
// 	tests.forEach(dice => {
// 		const input = dice.slice(1, -1);
// 		const results = macroToDice(macros, input);
// 		debug({input,results});
// 	});
// }
// main();

/*
node ./test/macroToDice.mjs codeName=dev
*/
