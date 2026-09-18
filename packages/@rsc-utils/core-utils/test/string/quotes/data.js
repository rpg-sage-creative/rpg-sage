const quoteTests = [
	{ unquoted:``,         quoted:`""`,             style:undefined },
	{ unquoted:` `,        quoted:`" "`,            style:undefined },
	{ unquoted:`simple`,   quoted:`"simple"`,       style:undefined },
	{ unquoted:`simple`,   quoted:`"simple"`,       style:"double" },
	{ unquoted:`simple`,   quoted:`'simple'`,       style:"single" },
	{ unquoted:`"simple"`, quoted:`"\\"simple\\""`, style:undefined },
	{ unquoted:`"smart"`,  quoted:`“"smart"”`,      style:"smart" },
	{ unquoted:`'simple'`, quoted:`'\\'simple\\''`, style:"single" },
	{ unquoted:`sim“”ple`, quoted:`"sim“”ple"`,     style:undefined },
	{ unquoted:`sim„“ple`, quoted:`"sim„“ple"`,     style:undefined },
	{ unquoted:`sim''ple`, quoted:`"sim''ple"`,     style:undefined },

	{ unquoted:`simple "with" quotes`,              quoted:`"simple \\"with\\" quotes"`,                      style:undefined },
	{ unquoted:`simple "with \\"double\\"" quotes`, quoted:`"simple \\"with \\\\"double\\\\"\\" quotes"`,     style:undefined },
	{ unquoted:`simple 'with' quotes`,              quoted:`'simple \\'with\\' quotes'`,                      style:"single" },

	{ unquoted:` " `, quoted:`" \\" "`,                                             style:undefined },
	{ unquoted:` " \\" " `, quoted:`" \\" \\\\" \\" "`,                             style:undefined },
	{ unquoted:` " \\" \\\\\\" \\" " `, quoted:`" \\" \\\\" \\\\\\\\" \\\\" \\" "`, style:undefined },
];

const dequoteTests = [
	{ quoted:`""`,                  unquoted:``,                    style:undefined, isQuoted:true },
	{ quoted:` '‘"“„ `,             unquoted:` '‘"“„ `,             style:undefined, isQuoted:false },
	{ quoted:`"'‘“„"`,              unquoted:`'‘“„`,                style:undefined, isQuoted:true },

	{ quoted:` 'normal single' `,   unquoted:` 'normal single' `,   style:undefined, isQuoted:false },
	{ quoted:` ‘fancy single’ `,    unquoted:` ‘fancy single’ `,    style:undefined, isQuoted:false },
	{ quoted:` "normal double" `,   unquoted:` "normal double" `,   style:undefined, isQuoted:false },
	{ quoted:` “fancy double” `,    unquoted:` “fancy double” `,    style:undefined, isQuoted:false },

	{ quoted:`'normal single'`,     unquoted:`normal single`,       style:undefined, isQuoted:true },
	{ quoted:`‘fancy single’`,      unquoted:`fancy single`,        style:undefined, isQuoted:true },
	{ quoted:`"normal double"`,     unquoted:`normal double`,       style:undefined, isQuoted:true },
	{ quoted:`“fancy double”`,      unquoted:`fancy double`,        style:undefined, isQuoted:true },

	// { quoted:``, unquoted:false, style:undefined },
];

export function getTests(which) {
	switch(which) {
		case "quote": return quoteTests;
		case "dequote": return quoteTests.concat(dequoteTests);
		case "isQuoted": return quoteTests.concat(dequoteTests);
		default: return [];
	}
}