
function getJson(...args) {
	try {
		return require(`./config/${args.join("-")}.json`);
	}catch(ex) {
		return { };
	}
}

const appNames = [
	"map",
	// "pdf",
	// "random",
	// "search"
];
const apps = appNames.map(app => {
	return {
		name: `sage-${app}-service`,
		script: `./build/${app}.mjs`,
		args: `--max-memory-restart 500M`,
		node_args: "--experimental-modules --es-module-specifier-resolution=node",

		append_env_to_name: true,
		wait_ready: true,
		env: { ...getJson("env"), ...getJson("env", app) },
		env_dev: { NODE_ENV: "dev", ...getJson("env", app, "dev") },
		env_beta: { NODE_ENV: "beta", ...getJson("env", app, "beta") },
		env_stable: { NODE_ENV: "stable", ...getJson("env", app, "stable") },

		error_file: `./logs/${app}.log`,
		out_file: `./logs/${app}.log`,
		log_date_format: "YYYY-MM-DD",
		time: true,
	};
});

const deploy = {
	dev: { ...getJson("deploy"), ...getJson("deploy", "services"), ...getJson("deploy", "dev") },
	beta: { ...getJson("deploy"), ...getJson("deploy", "services"), ...getJson("deploy", "beta") },
	stable: { ...getJson("deploy"), ...getJson("deploy", "services"), ...getJson("deploy", "stable") },
};

module.exports = { apps, deploy };
