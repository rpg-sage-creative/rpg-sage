import { ArgsManager, tagLiterals } from "../../build/index.js";

describe("args", () => {
	describe("ArgsManager", () => {

		test(`ArgsManager.from("first second").length === 2`, () => {
			expect(ArgsManager.from("first second").length).toBe(2);
			expect(ArgsManager.from("sword sword='board' 'sword and board' sword=''").length).toBe(4);
		});

		const testEnum = { First:0, NotFirst:1, "0":"First", "1":"NotFirst" };

		const tests = [
			{ raw:`first`,        isValue:true,     value:`first` },
			{ raw:`two=too`,      isKeyValue:true,  key:`two`,   value:`too` },
			{ raw:`three="tree"`, isKeyValue:true,  key:`three`, value:`tree` },
			{ raw:`--test`,       isFlag:true,      key:`test` },
			{ raw:`hp+=5`,        isIncrement:true, key:`hp`, operator:`+`, value:5 },
			{ raw:``,             isInvalid:true  },              // empty string is not an arg
			{ raw:` `,            isInvalid:true  },              // blank string is not an arg
			{ raw:` \t `,         isInvalid:true  },              // blank string is not an arg
			{ raw:` \n ` ,        isInvalid:true  },              // blank string is not an arg
			{ raw:`""`,           isValue:true,     value:null }, // empty quotes is a blank string
			{ raw:`" "`,          isValue:true,     value:` `  }, // non-empty quotes returns value
			{ raw:`"not first"`,  isValue:true,     value:`not first` },
			{ raw:`NOTFIRST`,     isValue:true,     value:`NOTFIRST` },
			{ raw:`dying--`,      isIncrement:true, key:`dying`, operator:`-`, value:1 },
			{ raw:`mp-="4"`,      isIncrement:true, key:`mp`, operator:`-`, value:4 },
		];
		const raw = tests.map(t => t.raw);
		const args = new ArgsManager(raw);
		describe(tagLiterals`new ArgsManager(${raw});`, () => {
			let invalidIndexAdjustor = 0;
			tests.forEach(({ raw, isFlag, isIncrement, isKeyValue, isValue, isInvalid, key, operator, value }, rawIndex) => {
				// lazy way of shortening test description to only the true flag
				const flag = { };
				if (isFlag) flag.isFlag = isFlag;
				if (isIncrement) flag.isIncrement = isIncrement;
				if (isKeyValue) flag.isKeyValue = isKeyValue;
				if (isValue) flag.isValue = isValue;
				if (isInvalid) flag.isInvalid = isInvalid;
				test(tagLiterals`${rawIndex}: ${{ raw, ...flag }}`, () => {
					// check for raw arg at the index
					expect(args.raw()[rawIndex]).toBe(raw);

					const argIndex = rawIndex - invalidIndexAdjustor;

					// get arg
					const arg = args.args()[argIndex];

					// invalid args won't get parsed.
					if (isInvalid) {
						// current arg should not be test arg
						expect(arg.raw).not.toBe(raw);
						// adjust index of others
						invalidIndexAdjustor++;
						// ensure arg isn't found
						expect(args.args().some(arg => arg.raw === raw)).toBe(false);
						// stop processing tests for this arg
						return;
					}

					// check all properties
					// expect(arg.index).toBe(rawIndex);
					expect(arg.isFlag).toBe(isFlag);
					expect(arg.isIncrement).toBe(isIncrement);
					expect(arg.isKeyValue).toBe(isKeyValue);
					expect(arg.isValue).toBe(isValue);
					expect(arg.key).toBe(key);
					expect(arg.operator).toBe(operator);
					expect(arg.value).toBe(value);
				});
			});
		});

		test(tagLiterals`new ArgsManager(${raw});`, () => {
			expect(args.length).toBe(tests.filter(test => !test.isInvalid).length);
			expect(args.nonKeyValueArgs().length).toBe(tests.filter(test => !test.isInvalid && !test.isKeyValue).length);
			expect(args.nonKeyValueStrings()[1]).toBe("--test");
			expect(args.nonKeyValueStrings()[8]).toBe(`mp-="4"`);
			expect(args.raw().shift()).toBe("first");
			expect(args.raw().pop()).toBe('mp-="4"');
			expect(args.args().pop().isIncrement).toBe(true);
			expect(args.args().shift()?.isFlag).toBeUndefined();
			expect(args.args().shift()?.isValue).toBe(true);
			expect(args.valueArgs()[0]?.isValue).toBe(true); // `first`
			expect(args.valueArgs()[0]?.index).toBe(0);
			expect(args.valueArgs()[1]?.isValue).toBe(true); // `""`
			expect(args.valueArgs()[1]?.index).toBe(5);
			expect(args.valueArgs()[1]?.value).toBeNull();
			expect(args.valueArgs()[2]?.value).toBe(" ");
			expect(args.keyValueArgs()[0]?.isKeyValue).toBe(true);
			expect(args.keyValueArgs()[0]?.index).toBe(1);
			expect(args.keyValueArgs("TWo").length).toBe(1);
			expect(args.keyValueArgs("TwO", "thREe").length).toBe(2);
			expect(args.flagArgs().shift()?.isFlag).toBe(true);
			expect(args.flagArgs().pop()?.index).toBe(3);
			expect(args.flagArgs()[0]?.key).toBe("test");
			expect(args.incrementArgs().shift().isIncrement).toBe(true);
			expect(args.incrementArgs()[0].index).toBe(4);
			expect(args.incrementArgs()[0].key).toBe("hp");
			expect(args.incrementArgs()[0].operator).toBe("+");
			expect(args.incrementArgs()[0].value).toBe(5);
			expect(args.incrementArgs().pop().isIncrement).toBe(true);
			expect(args.incrementArgs()[1].index).toBe(9);
			expect(args.incrementArgs()[1].key).toBe("dying");
			expect(args.incrementArgs()[1].operator).toBe("-");
			expect(args.incrementArgs()[1].value).toBe(1);
			expect(args.incrementArgs()[2].index).toBe(10);
			expect(args.incrementArgs()[2].key).toBe("mp");
			expect(args.incrementArgs()[2].operator).toBe("-");
			expect(args.incrementArgs()[2].value).toBe(4);
			expect(args.enumValues(testEnum)).toStrictEqual([0,1]);
			// expect(args.removeKeyValuePair("two")?.value).toBe("too");
			// expect(args.removeKeyValuePair("three")?.value).toBe("tree");
			// expect(args.removeKeyValuePair("four")?.value).toBe(undefined);
		});

	});
});