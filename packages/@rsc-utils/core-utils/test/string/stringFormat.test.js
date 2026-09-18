import { stringFormat, tagLiterals } from "../../build/index.js";

describe("string", () => {
	describe("stringFormat", () => {

		const tests = [
			{ template:`nothing to sub`, args:[], expected:`nothing to sub` },

			{ template:`#{0} to sub`, args:["one"], expected:`one to sub` },
			{ template:`#{0} to #{1}`, args:["one", "sub"], expected:`one to sub` },
			{ template:`#{0} #{2} #{1}`, args:["one", "sub", "to"], expected:`one to sub` },

			{ template:`\${one} to sub`, args:[{one:"one"}], expected:`one to sub` },
			{ template:`\${one} to \${sub}`, args:[{one:"one"},{sub:"sub"}], expected:`one to sub` },
			{ template:`\${one} #{2} \${sub}`, args:[{one:"one"},{sub:"sub"},"to"], expected:`one to sub` },

			{ template:`\${one} \${one.to} sub`, args:[{one:"one"},{one:{to:"to"}}], expected:`one to sub` },
			{ template:`\${one} \${one.to} \${one.to.sub}`, args:[{one:"one"},{one:{to:"to"}},{one:{"to":{sub:"sub"}}}], expected:`one to sub` },

			// valid results due to missing args
			{ template:`#{0} to sub`, args:[], expected:`#{0} to sub` },
			{ template:`#{0} to #{1}`, args:["one"], expected:`one to #{1}` },
			{ template:`#{0} #{2} #{1}`, args:["one", "sub"], expected:`one #{2} sub` },

			// valid results due to "one.to" being {to:"to"} instead of "to"
			{ template:`\${one} \${one.to} sub`, args:[{one:"one"},{one:{"to":{to:"to"}}}], expected:`one [object Object] sub` },
		];
		tests.forEach(({ template, args, expected }) => {
			test(tagLiterals`stringFormat(${template}, ...${args}) === ${expected}`, () => {
				expect(stringFormat(template, ...args)).toBe(expected);
			});
		});

	});
});
