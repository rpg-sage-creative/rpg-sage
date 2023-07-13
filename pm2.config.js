module.exports = {
	apps: [
		{
			name: "rpg-sage",
			script: "./app.mjs",
			cwd: "./dist",
			args: "stable dist",
			node_args: "--experimental-modules --es-module-specifier-resolution=node",

			env: {
				NODE_ENV: "development",
				botCodeName: "dev",
				pf2DataPath: "./data/pf2e",
			},
			env_beta: {
				NODE_ENV: "staging",
				botCodeName: "beta",
				pf2DataPath: "./data/pf2e",
			},
			env_stable: {
				NODE_ENV: "production",
				botCodeName: "stable",
				pf2DataPath: "./data/pf2e",
			},

			error_file: "./data/logs/error.log",
			out_file: "./data/logs/out.log",
			log_date_format: "YYYY-MM-DD",
			time: true,
		}
	],
	deploy: {
		development: {
			"user": "Randal T Meyer",

		}
	}
}