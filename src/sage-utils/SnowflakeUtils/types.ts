export type Snowflake = string;

/** Constant value that represents a nil Snowflake. */
export const NIL_SNOWFLAKE = "0000000000000000" as NIL_SNOWFLAKE;

/** A nil Snowflake has all (16) 0s. */
export type NIL_SNOWFLAKE = string & { nil_snowflake:never; };