import utils from "../../dist/sage-utils"

export default function testStringUtils() {

	//#region JaroWinkler tests

	function testJaroWinkler() {
		const inputs = [
			["", "bob", 0, 0],
			["bob", "bob", 1, 1],
			["crate", "trace", 0.733333, 0.733333],
			["trate", "trace", 0.866667, 0.906667],
			["dwayne", "duane", 0.822222, 0.84],
			["arnab", "aranb", 0.933333, 0.946667]
		];
		inputs.forEach(values => {
			const [first, second, expectedJaro, expectedJaroWinkler] = values;
			const resultData = utils.StringUtils.Comparison.JaroWinklerComparator.calculate(first, second);
			assert("Jaro", first, second, resultData.jaroSimilarity, expectedJaro);
			assert("JaroWinkler", first, second, resultData.jaroWinklerSimilarity, expectedJaroWinkler);
		});
		function assert(which, first, second, result, expected) {
			const resultFixed = result.toFixed(6);
			const expectedFixed = expected.toFixed(6);
			console.assert(resultFixed === expectedFixed, `${which}("${first}", "${second}") = ${resultFixed} !== ${expectedFixed}`);
		}
	}

	testJaroWinkler();

	//#endregion

}
