
function getJson(...args) {
	try {
		return require(`./config/${args.join("-")}.json`);
	}catch(ex) {
		return { };
	}
}

module.exports = {
	apps: [
		{
			name: `sage-legacy-mono`,
			script: `./mono.mjs`,
			cwd: "./dist",
			node_args: "--experimental-modules --es-module-specifier-resolution=node",

			append_env_to_name: true,
			wait_ready: true,
			env: { ...getJson("env"), ...getJson("env", "mono"), mono:true },
			env_dev: { ...getJson("env", "mono", "dev"), NODE_ENV: "dev" },
			env_beta: { ...getJson("env", "mono", "beta"), NODE_ENV: "beta" },
			env_stable: { ...getJson("env", "mono", "stable"), NODE_ENV: "stable" },

			error_file: `../logs/mono.log`,
			out_file: `../logs/mono.log`,
			log_date_format: "YYYY-MM-DD",
			time: true,
		}
	]
};
