import { warn } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { applyDiceMacroArgs } from "./applyDiceMacroArgs.js";
import { parseDiceMacroCall, type DiceMacroArgs } from "./parseDiceMacroCall.js";
import type { DiceMacroBase } from "./types.js";

/** If any value is duplicated in a different index, we have an overflow. */
function isStackOverflow(item: string, index: number, stack: string[]): boolean {
	return stack.indexOf(item) !== index;
}

/**
 * When used to .split() a dice string wrapped with [], it generates an array consisting of the contents of each set of brackets with an empty string as the first and last items of the array.
 */
const OuterBlockSplitRegExp = regex()`
	(^\[)  # lead opening bracket
	|
	(\])   # internal closing bracket
	\s*    # optional space
	(\[)   # internal opening bracket
	|
	(\]$)  # trailing closing bracket
`;

/** Processes a diceString or macroCall that is made up of multiple diceStrings or macroCalls using [][] */
function processOuterBlocks(input: string, macroTiers: DiceMacroBase[][], argsStack: DiceMacroArgs[], stack: string[]): string[] {
	const flattened: string[] = [];

	// split the dice and also remove the excess empty strings created by the split.
	const outerBlocks = input.split(OuterBlockSplitRegExp).slice(1, -1);

	// iterate annd flatten the blocks
	for (const block of outerBlocks) {
		const flattenedBlocks = flattenDiceMacro(block, macroTiers, argsStack, stack.concat(block));
		for (const fBlock of flattenedBlocks) {
			flattened.push(fBlock);
		}
	}

	return flattened;
}

/** Used with .split() to break a call up while keeping the original splitting text. */
const InnerBlockSplitRegExp = /(\s*;\s*)/;

/** Processes a diceString or macroCall that is made up of multiple parts split by ; */
function processInnerBlocks(input: string, macroTiers: DiceMacroBase[][], argsStack: DiceMacroArgs[], stack: string[]): string[] {
	const innerBlocks = input.split(InnerBlockSplitRegExp);
	// we will have an odd number of array items, with odd indexes as the split values
	for (let i = -1; i < innerBlocks.length; i++) {
		i++; // skip split value to the innerBlock
		const innerBlock = innerBlocks[i]!;
		const processed = processBlock(innerBlock, macroTiers, argsStack, stack);
		for (let j = 0; j < processed.length; j++) {
			processed[j] = processed[j]!.slice(1, -1);
		}
		innerBlocks[i] = processed.join("; ");
	}
	return ["[" + innerBlocks.join("") + "]"];
}

/** Processes a single diceString or diceMacroCall. */
function processBlock(input: string, macroTiers: DiceMacroBase[][], argsStack: DiceMacroArgs[], stack: string[]): string[] {
	// if we have a nested macro then we need to keep passing the unused args
	const includeUnusedArgs = !!parseDiceMacroCall(input, macroTiers)?.macro;

	// apply the args
	const withArgs = applyDiceMacroArgs(input, argsStack, includeUnusedArgs);

	const { macro, indexed = [], named = [] } = parseDiceMacroCall(withArgs, macroTiers) ?? {};

	// no macro means we have dice we can work with
	if (!macro) {
		return [withArgs];
	}

	// we have another macro so we need to flatten again
	return flattenDiceMacro(macro.dice, macroTiers, [{ indexed, named }].concat(argsStack), stack.concat(macro.dice));
}

export function flattenDiceMacro(input: string, macroTiers: DiceMacroBase[][], argsStack: DiceMacroArgs[], stack: string[] = []): string[] {
	// avoid a stack overflow
	if (stack.some(isStackOverflow)) {
		warn(`Macro Recursion (flattenDiceMacro)`, { input, stack });
		return ["[0d0 Recursion!]"];
	}

	// if we have brackets, split on ][ to ensure we grab and parse each block of a multiblock macro
	if (input.startsWith("[") && input.endsWith("]")) {
		return processOuterBlocks(input, macroTiers, argsStack, stack);
	}

	// if we have ;, split on ; and check to see if any component parts have macros
	if (input.includes(";")) {
		return processInnerBlocks(input, macroTiers, argsStack, stack);
	}

	// process a simple diceString or diceMacroCall
	return processBlock(input, macroTiers, argsStack, stack);
}