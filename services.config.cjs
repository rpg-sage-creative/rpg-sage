
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
		env: { },
		env_dev: { NODE_ENV: "dev", ...getJson("env", "dev") },
		env_beta: { NODE_ENV: "beta", ...getJson("env", "beta") },
		env_stable: { NODE_ENV: "stable", ...getJson("env", "stable") },

		error_file: `./logs/${app}.log`,
		out_file: `./logs/${app}.log`,
		log_date_format: "YYYY-MM-DD",
		time: true,
	};
});

const deploy = {
	docker: getJson("deploy", "services", "docker"),
	dev: getJson("deploy", "services", "dev"),
	beta: getJson("deploy", "services", "beta"),
	stable: getJson("deploy", "services", "stable"),
};

module.exports = { apps, deploy };
