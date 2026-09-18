import { tagLiterals } from "@rsc-utils/template-literal-utils";
import { isBigInt, isBoolean, isDefined, isFiniteNumber, isNull, isNullOrUndefined, isNumber, isNumeric, isPrimitive, isString, isUndefined } from "../build/index.js";

describe("typeGuards", () => {
	const tests = [
		{ value:null,       isBigInt:false, isBoolean:false, isDefined:false, isFiniteNumber:false, isNull: true,  isNullOrUndefined:true,  isNumber:false, isNumeric:false, isPrimitive:true,  isUndefined: false, isString:false, },
		{ value:undefined,  isBigInt:false, isBoolean:false, isDefined:false, isFiniteNumber:false, isNull: false, isNullOrUndefined:true,  isNumber:false, isNumeric:false, isPrimitive:true,  isUndefined: true,  isString:false, },
		{ value:false,      isBigInt:false, isBoolean:true,  isDefined:true,  isFiniteNumber:false, isNull: false, isNullOrUndefined:false, isNumber:false, isNumeric:false, isPrimitive:true,  isUndefined: false, isString:false, },
		{ value:true,       isBigInt:false, isBoolean:true,  isDefined:true,  isFiniteNumber:false, isNull: false, isNullOrUndefined:false, isNumber:false, isNumeric:false, isPrimitive:true,  isUndefined: false, isString:false, },
		{ value:0n,         isBigInt:true,  isBoolean:false, isDefined:true,  isFiniteNumber:false, isNull: false, isNullOrUndefined:false, isNumber:false, isNumeric:true,  isPrimitive:true,  isUndefined: false, isString:false, },
		{ value:1n,         isBigInt:true,  isBoolean:false, isDefined:true,  isFiniteNumber:false, isNull: false, isNullOrUndefined:false, isNumber:false, isNumeric:true,  isPrimitive:true,  isUndefined: false, isString:false, },
		{ value:new Date(), isBigInt:false, isBoolean:false, isDefined:true,  isFiniteNumber:false, isNull: false, isNullOrUndefined:false, isNumber:false, isNumeric:false, isPrimitive:true,  isUndefined: false, isString:false, },
		{ value:0,          isBigInt:false, isBoolean:false, isDefined:true,  isFiniteNumber:true,  isNull: false, isNullOrUndefined:false, isNumber:true,  isNumeric:true,  isPrimitive:true,  isUndefined: false, isString:false, },
		{ value:1,          isBigInt:false, isBoolean:false, isDefined:true,  isFiniteNumber:true,  isNull: false, isNullOrUndefined:false, isNumber:true,  isNumeric:true,  isPrimitive:true,  isUndefined: false, isString:false, },
		{ value:NaN,        isBigInt:false, isBoolean:false, isDefined:true,  isFiniteNumber:false, isNull: false, isNullOrUndefined:false, isNumber:true,  isNumeric:true,  isPrimitive:true,  isUndefined: false, isString:false, },
		{ value:Infinity,   isBigInt:false, isBoolean:false, isDefined:true,  isFiniteNumber:false, isNull: false, isNullOrUndefined:false, isNumber:true,  isNumeric:true,  isPrimitive:true,  isUndefined: false, isString:false, },
		{ value:"",         isBigInt:false, isBoolean:false, isDefined:true,  isFiniteNumber:false, isNull: false, isNullOrUndefined:false, isNumber:false, isNumeric:false, isPrimitive:true,  isUndefined: false, isString:true, },
		{ value:"control",  isBigInt:false, isBoolean:false, isDefined:true,  isFiniteNumber:false, isNull: false, isNullOrUndefined:false, isNumber:false, isNumeric:false, isPrimitive:true,  isUndefined: false, isString:true, },
		{ value:[],         isBigInt:false, isBoolean:false, isDefined:true,  isFiniteNumber:false, isNull: false, isNullOrUndefined:false, isNumber:false, isNumeric:false, isPrimitive:false, isUndefined: false, isString:false, },
		{ value:{},         isBigInt:false, isBoolean:false, isDefined:true,  isFiniteNumber:false, isNull: false, isNullOrUndefined:false, isNumber:false, isNumeric:false, isPrimitive:false, isUndefined: false, isString:false, },
	];

	const functions = [
		isBigInt,
		isBoolean,
		isDefined,
		// isErrorLike
		isFiniteNumber,
		isNull,
		isNullOrUndefined,
		isNumber,
		isNumeric,
		isPrimitive,
		isString,
		isUndefined,
		// isWholeNumberString
	];

	functions.forEach(fn => {
		describe(fn.name, () => {
			tests.forEach(testData => {
				test(tagLiterals`${fn.name}(${testData.value}) === ${testData[fn.name]}`, () => {
					expect(fn(testData.value)).toBe(testData[fn.name]);
				});
			});
		});
	});

});
