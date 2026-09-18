/** [ { input:string; expected:KeyValueArg|null }] */
const parseKeyValueArgTests = [
	{ input:`a= `,           expected:undefined },
	{ input:`a=\t`,           expected:undefined },
	{ input:`a=\n`,           expected:undefined },

	{ input:`a= .1`,           expected:undefined },
	{ input:`a=.1`,           expected:{ raw:`a=.1`,        index:-1, isKeyValue:true, isNaked:true, key:`a`, value:`.1` } },
	{ input:`a=1`,            expected:{ raw:`a=1`,         index:-1, isKeyValue:true, isNaked:true, key:`a`, value:`1` } },
	{ input:`a=||1||`,        expected:{ raw:`a=||1||`,     index:-1, isKeyValue:true, isNaked:true, key:`a`, value:`||1||` } },
	{ input:`a=||1 + 2||`,    expected:{ raw:`a=||1 + 2||`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:`||1 + 2||` } },
	{ input:`a=1.0`,          expected:{ raw:`a=1.0`,       index:-1, isKeyValue:true, isNaked:true, key:`a`, value:`1.0` } },
	{ input:`a=+2`,           expected:{ raw:`a=+2`,        index:-1, isKeyValue:true, isNaked:true, key:`a`, value:`+2` } },
	{ input:`a=-2`,           expected:{ raw:`a=-2`,        index:-1, isKeyValue:true, isNaked:true, key:`a`, value:`-2` } },

	{ input:`a=b`,            expected:{ raw:`a=b`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:`b` } },
	{ input:`a.1=b`,          expected:{ raw:`a.1=b`, index:-1, isKeyValue:true, isNaked:true, key:`a.1`, value:`b` } },
	{ input:`a-1=b`,          expected:{ raw:`a-1=b`, index:-1, isKeyValue:true, isNaked:true, key:`a-1`, value:`b` } },
	{ input:`-a1=b`,          expected:undefined },
	{ input:`.a1=b`,          expected:undefined },

	{ input:`a="b"`,          expected:{ raw:`a="b"`, index:-1, isKeyValue:true, key:`a`, value:`b` } },
	{ input:`a="b\\"b"`,      expected:{ raw:`a="b\\"b"`, index:-1, isKeyValue:true, key:`a`, value:`b"b` } },

	{ input:`a='b'`,          expected:{ raw:`a='b'`, index:-1, isKeyValue:true, key:`a`, value:`b` } },
	{ input:`a='b\\'b'`,      expected:{ raw:`a='b\\'b'`, index:-1, isKeyValue:true, key:`a`, value:`b'b` } },

	{ input:`a=`,             expected:undefined },
	{ input:`a= `,            expected:undefined },
	{ input:`a= "`,           expected:undefined },
	{ input:`a= b"`,          expected:undefined },

	{ input:`a= "''"`,        expected:undefined },
	{ input:`a= '""'`,        expected:undefined },
	{ input:`a=\n'""'`,       expected:undefined },
	{ input:`a=\t'""'`,       expected:undefined },

	{ input:`a=""`,           expected:{ raw:`a=""`, index:-1, isKeyValue:true, key:`a`, value:null } },
	{ input:`a=''`,           expected:{ raw:`a=''`, index:-1, isKeyValue:true, key:`a`, value:null } },
	{ input:`a=$$%$$%$%$`,    expected:{ raw:`a=$$%$$%$%$`, index:-1, isKeyValue:true, isNaked:true, key:`a`, value:`$$%$$%$%$` } },
	{ input:`a="$$%$$%$%$"`,  expected:{ raw:`a="$$%$$%$%$"`, index:-1, isKeyValue:true, key:`a`, value:`$$%$$%$%$` } },
	{ input:`a='$$%$$%$%$'`,  expected:{ raw:`a='$$%$$%$%$'`, index:-1, isKeyValue:true, key:`a`, value:`$$%$$%$%$` } },
];

const parseKeyValueArgsTests = [
	{ input:`arg1=0`, expected:[
		{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
	] },
	{ input:`arg.1=0`, expected:[
		{ raw:`arg.1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg.1`, value:"0" },
	] },
	{ input:`arg-1=0`, expected:[
		{ raw:`arg-1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg-1`, value:"0" },
	] },
	{ input:`arg2="blah"`, expected:[
		{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
	] },
	{ input:`arg1=0 arg2="blah"`, expected:[
		{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
		{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
	] },
	{ input:`arg1=||0|| arg2="blah"`, expected:[
		{ raw:`arg1=||0||`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"||0||" },
		{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
	] },
	{ input:` arg2="blah" arg1=||0||`, expected:[
		{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
		{ raw:`arg1=||0||`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"||0||" },
	] },

	{ input:`[macroName arg1=0]`, expected:[
		{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
	] },
	{ input:`[macroName arg2="blah"]`, expected:[
		{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
	] },
	{ input:`[macroName arg1=0 arg2="blah"]`, expected:[
		{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
		{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
	] },
	{ input:`[macroName arg1=0\narg2="blah"]`, expected:[
		{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
		{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
	] },
	{ input:`[macroName arg1=0arg2="bl ah"]`, expected:[
		{ raw:`arg1=0arg2="bl`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0arg2=\"bl" },
	] },
	{ input:`[macroName arg1=0arg2="blah"]`, expected:[
		{ raw:`arg1=0arg2="blah"`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0arg2=\"blah\"" },
	] },
	{ input:`[macroName  arg2="blah"arg1=0]`, expected:[
		{ raw:`arg2="blah"`, index:-1, isKeyValue:true, key:`arg2`, value:"blah" },
		{ raw:`arg1=0`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"0" },
	] },
	{ input:`[macroName  arg2='"blah"arg1=0']`, expected:[
		{ raw:`arg2='"blah"arg1=0'`, index:-1, isKeyValue:true, key:`arg2`, value:"\"blah\"arg1=0" },
	] },
	{ input:`[macroName arg1=||0|| arg2="||blah||"]`, expected:[
		{ raw:`arg1=||0||`, index:-1, isKeyValue:true, isNaked:true, key:`arg1`, value:"||0||" },
		{ raw:`arg2="||blah||"`, index:-1, isKeyValue:true, key:`arg2`, value:"||blah||" },
	] },
];

const isKeyValueArgTests = [

].concat(parseKeyValueArgTests.map(({ input, expected }) => ({ input, expected:!!expected })));

/*
{
	index,
	isIncrement: true,
	key,
	operator: decrement?.[0] as "-" ?? increment?.[0] ?? operator![0],
	raw,
	value,
}
*/

const parseIncrementArgTests = [
	{ input:`a`, expected:undefined },
	{ input:`a=`, expected:undefined },
	{ input:`a=b`, expected:undefined },
	{ input:`a="b"`, expected:undefined },
	{ input:`a-="b"`, expected:undefined },
	{ input:`a+="b"`, expected:undefined },
	{ input:`a++`, expected:{ index:-1, isIncrement:true, key:"a", operator:"+", value:1, raw:`a++` } },
	{ input:`a--`, expected:{ index:-1, isIncrement:true, key:"a", operator:"-", value:1, raw:`a--` } },
	{ input:`a—`, expected:{ index:-1, isIncrement:true, key:"a", operator:"-", value:1, raw:`a—` } },
	{ input:`a+="2"`, expected:{ index:-1, isIncrement:true, key:"a", operator:"+", value:2, raw:`a+="2"` } },
	{ input:`a-="3"`, expected:{ index:-1, isIncrement:true, key:"a", operator:"-", value:3, raw:`a-="3"` } },
];

export function getTests(which) {
	switch(which) {
		case "isKeyValueArg": return isKeyValueArgTests;
		case "parseIncrementArg": return parseIncrementArgTests;
		case "parseKeyValueArg": return parseKeyValueArgTests;
		case "parseKeyValueArgs": return parseKeyValueArgsTests;
		default: return [];
	}
}