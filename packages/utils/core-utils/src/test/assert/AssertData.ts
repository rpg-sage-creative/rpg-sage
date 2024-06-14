import { getAssertLabel } from "./AssertLabel.js";

type AssertCounts = {
	total: number;
	passed: number;
	failed: number;
};

type LabeledAssertCounts = AssertCounts & {
	label: string;
};

type AssertData = AssertCounts & {
	labeled: LabeledAssertCounts[];
};

let _assertData: AssertData | undefined;

/** Clears any assertion data. */
export function clearAssertData(): void {
	_assertData = undefined;
}

/** Returns the current totals, or all 0s if no assertions have been incremented. */
export function getAssertData(): AssertData {
	return _assertData ?? { total:0, passed:0, failed:0, labeled:[] };
}

/**
 * Increments the total number of assertions.
 * If given true, the number of passed assertions is incremented.
 * Otherwise, the number of failed assertions is incremented;
 */
export function incrementAssertData(passed: boolean): void {
	const assertData = _assertData ?? (_assertData = { total:0, passed:0, failed:0, labeled:[] });

	assertData.total++;
	if (passed) {
		assertData.passed++;
	}else {
		assertData.failed++;
	}

	const label = getAssertLabel();
	if (label) {
		let labeledData = assertData.labeled.find(data => data.label === label);
		if (!labeledData) {
			labeledData = { total:0, passed:0, failed:0, label };
			assertData.labeled.push(labeledData);
		}
		labeledData.total++;
		if (passed) {
			labeledData.passed++;
		}else {
			labeledData.failed++;
		}
	}
}