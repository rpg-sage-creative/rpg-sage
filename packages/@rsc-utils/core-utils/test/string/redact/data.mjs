/**
 * @typedef {{
	* input?: string | null;
	* expected?: string | null;
	* char?: {
		* char: string;
		* expected: string;
	* };
	* complete?: {
		* complete: boolean;
		* expected: string;
	* };
	* options?: {
		* char: string;
		* complete: boolean;
		* expected: string;
	* };
 * }} Test
 */

const empties = [
	{ input:null, expected:null },

	{
		input: undefined,
		expected: undefined,
		char: { char:undefined, expected:undefined },
		complete: { complete:undefined, expected:undefined },
		options: { char:undefined, complete:undefined, expected:undefined },
	},

	{
		input: "",
		expected: "",
		char: { char:"&", expected:"" },
		complete: { complete:true, expected:"" },
		options: { char:"&", complete:true, expected:"" },
	},

	{
		input: "nothing",
		expected: "nothing",
		char: { char:"&", expected:"nothing" },
		complete: { complete:true, expected:"nothing" },
		options: { char:"&", complete:true, expected:"nothing" },
	},

	{
		input: "[link](invalid_url)",
		expected: "[link](invalid_url)",
		char: { char:"&", expected:"[link](invalid_url)" },
		complete: { complete:true, expected:"[link](invalid_url)" },
		options: { char:"&", complete:true, expected:"[link](invalid_url)" },
	},
];

/** @type {Test[]} */
const redactCodeBlocksTests = [
	{
		input: "before `single` after",
		expected: "before `******` after",
		char: { char:undefined, expected:undefined },
		complete: { complete:undefined, expected:undefined },
		options: { char:undefined, complete:undefined, expected:undefined },
	},

	{
		input: "before `single` after",
		expected: "before `******` after",
		char: { char:"&", expected:"before `&&&&&&` after" },
		complete: { complete:true, expected:"before ******** after" },
		options: { char:"&", complete:true, expected:"before &&&&&&&& after" },
	},

	{
		input: "before ``double`` after",
		expected: "before ``******`` after",
		char: { char:"&", expected:"before ``&&&&&&`` after" },
		complete: { complete:true, expected:"before ********** after" },
		options: { char:"&", complete:true, expected:"before &&&&&&&&&& after" },
	},

	{
		input: "before ```triple``` after",
		expected: "before ```******``` after",
		char: { char:"&", expected:"before ```&&&&&&``` after" },
		complete: { complete:true, expected:"before ************ after" },
		options: { char:"&", complete:true, expected:"before &&&&&&&&&&&& after" },
	},

	{
		input: "`one` and ``two`` and ```three``` and ```mixed `up` some```",
		expected: "`***` and ``***`` and ```*****``` and ```***************```",
		char: { char:"&", expected:"`&&&` and ``&&&`` and ```&&&&&``` and ```&&&&&&&&&&&&&&&```" },
		complete: { complete:true, expected:"***** and ******* and *********** and *********************" },
		options: { char:"&", complete:true, expected:"&&&&& and &&&&&&& and &&&&&&&&&&& and &&&&&&&&&&&&&&&&&&&&&" },
	},

];

/** @type {Test[]} */
const redactKeyValuePairsTests = [
	{
		input: `[macro arg="value"]`,
		expected: `[macro ***="*****"]`,
		char: { char:undefined, expected:undefined },
		complete: { complete:undefined, expected:undefined },
		options: { char:undefined, complete:undefined, expected:undefined },
	},
	{
		input: `[macro arg="value"]`,
		expected: `[macro ***="*****"]`,
		options: { keyChar:"k", valueChar:"v", expected:`[macro kkk="vvvvv"]` },
	},
	{
		input: `[macro arg="value"]`,
		expected: `[macro ***="*****"]`,
		options: { char:"*", keyChar:"k", valueChar:"v", complete:true, expected:`[macro kkk**vvvvv*]` },
	},
	{
		input: `[macro arg=||piped||]`,
		expected: `[macro ***=*********]`,
		char: { char:"&", expected:`[macro &&&=&&&&&&&&&]` },
		complete: { complete:true, expected:`[macro *************]` },
		options: { char:"&", complete:true, expected:`[macro &&&&&&&&&&&&&]` },
	},
	{
		input: `[macro arg=||piped content||]`,
		expected: `[macro ***=*****************]`,
		char: { char:"&", expected:`[macro &&&=&&&&&&&&&&&&&&&&&]` },
		complete: { complete:true, expected:`[macro *********************]` },
		options: { char:"&", complete:true, expected:`[macro &&&&&&&&&&&&&&&&&&&&&]` },
	},
	{
		input: `[macro arg="value" a=c b=d]`,
		expected: `[macro ***="*****" *=* *=*]`,
		char: { char:"&", expected:`[macro &&&="&&&&&" &=& &=&]` },
		complete: { complete:true, expected:`[macro *********** *** ***]` },
		options: { char:"&", complete:true, expected:`[macro &&&&&&&&&&& &&& &&&]` },
	},
	{
		input: ` a="b" c.d="e" f-g="hi.j" naked=true `,
		expected: ` *="*" ***="*" ***="****" *****=**** `,
		char: { char:"&", expected:` &="&" &&&="&" &&&="&&&&" &&&&&=&&&& ` },
		complete: { complete:true, expected:` ***** ******* ********** ********** ` },
		options: { char:"&", complete:true, expected:` &&&&& &&&&&&& &&&&&&&&&& &&&&&&&&&& ` },
	},
	{
		input: "https://tenor.com/view/austin-powers-gif-5090756650443962254",
		expected: "https://tenor.com/view/austin-powers-gif-5090756650443962254",
	},
];

const redactMdLinksTests = [
	{
		input: `[link](http://rpgsage.io)`,
		expected: `[****](*****************)`,
	},
	{
		input: `[link](http://rpgsage.io)`,
		expected: `[****](*****************)`,
		options: { labelChar:"l", urlChar:"u", expected:`[llll](uuuuuuuuuuuuuuuuu)` },
	},
	{
		input: `[link](http://rpgsage.io)`,
		expected: `[****](*****************)`,
		options: { char:"&", complete:true, labelChar:"l", urlChar:"u", expected:`&llll&&uuuuuuuuuuuuuuuuu&` },
	},
	{
		input: `[link](<http://rpgsage.io>)`,
		expected: `[****](<*****************>)`,
		char: { char:"&", expected:`[&&&&](<&&&&&&&&&&&&&&&&&>)` },
		complete: { complete:true,          expected:`***************************` },
		options: { char:"&", complete:true, expected:`&&&&&&&&&&&&&&&&&&&&&&&&&&&` },
	},
	{
		input: `[Here is d20's list of additional deities](https://www.d20pfsrd.com/classes/core-classes/cleric/domains)\n[Here is the list of first-party domains, mapped to the first-party gods which have them](https://www.aonprd.com/ClericDomains.aspx)`,
		expected:                           `[****************************************](************************************************************)\n[***************************************************************************************](*****************************************)`,
		complete: { complete:true, expected:`********************************************************************************************************\n************************************************************************************************************************************` },
	},
];

// combine all tests into a single long string
const redactContentTest = redactCodeBlocksTests
	.concat(redactKeyValuePairsTests)
	.concat(redactMdLinksTests)
	.filter((test, index, tests) => tests.findIndex(t => test.input === t.input) === index)
	.reduce((out, test) => {
			out.input += "\n" + test.input;
			out.expected += "\n" + test.expected;
			return out;
		}, { input:"", expected:"" }
	);
// add a "complete" redaction option to the unified test
redactContentTest.complete = {
	complete: true,
	expected: redactContentTest.expected.replaceAll(/(\[macro.*?\])|([`"\=\[\]\(\)\<\>])/g, (_, macro, _punc) => {
		// we wanna leave the brackets in place for macro calls
		if (macro) return "[" + macro.slice(1, -1).replaceAll(/[`"\=\[\]\(\)\<\>]/g, "*") + "]";
		// all other punctation should be from redactions
		return "*";
	})
};

/**
 *
 * @param {"redactCodeBlocks"|"redactKeyValuePairs"|"redactMdLinks"|"redactContent"} which
 * @returns {Test[]}
 */
export function getTests(which) {
	switch(which) {
		case "redactCodeBlocks": return empties.concat(redactCodeBlocksTests);
		case "redactKeyValuePairs": return empties.concat(redactKeyValuePairsTests);
		case "redactMdLinks": return empties.concat(redactMdLinksTests);
		case "redactContent": return empties.concat(redactCodeBlocksTests).concat(redactKeyValuePairsTests).concat(redactMdLinksTests).concat([redactContentTest]);
		default: return [];
	}
}