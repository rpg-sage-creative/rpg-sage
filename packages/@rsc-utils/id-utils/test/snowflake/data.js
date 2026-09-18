/**
 * @param {string} generateSnowflake
 * @param {`${bigint}`} NIL_SNOWFLAKE
 * @returns
 */
export function getTests(generateSnowflake, NIL_SNOWFLAKE) {
	return [
		{ input:"00000",         isSnowflakeResult:false, isNilSnowflakeResult:false, isNonNilSnowflakeResult:false, orNilSnowflakeResult:NIL_SNOWFLAKE },
		{ input:NIL_SNOWFLAKE,   isSnowflakeResult:true,  isNilSnowflakeResult:true,  isNonNilSnowflakeResult:false, orNilSnowflakeResult:NIL_SNOWFLAKE },
		{ input:"1234567890",    isSnowflakeResult:false, isNilSnowflakeResult:false, isNonNilSnowflakeResult:false, orNilSnowflakeResult:NIL_SNOWFLAKE },
		{ input:generateSnowflake, isSnowflakeResult:true,  isNilSnowflakeResult:false, isNonNilSnowflakeResult:true,  orNilSnowflakeResult:generateSnowflake },
		{ input:"control",       isSnowflakeResult:false, isNilSnowflakeResult:false, isNonNilSnowflakeResult:false, orNilSnowflakeResult:NIL_SNOWFLAKE },
	];
}