const tests = [
	{ unwrapped:`value`, chars:`()`, wrapped:`(value)` },
	{ unwrapped:`value`, chars:`[]`, wrapped:`[value]` },
	{ unwrapped:`value`, chars:`[[]]`, wrapped:`[[value]]` },
	{ unwrapped:`value`, chars:`[[[]]]`, wrapped:`[[[value]]]` },
	{ unwrapped:`value`, chars:`'`, wrapped:`'value'` },
	{ unwrapped:`value`, chars:`''`, wrapped:`'value'` },
	{ unwrapped:`value`, chars:`'''`, wrapped:`'''value'''` },
	{ unwrapped:`value`, chars:`'|:`, wrapped:`'|:value:|'` },
];

export function getTests() {
	return tests;
}