
function getJson(...args) {
	try {
		return require(`./config/${args.join("-")}.json`);
	}catch(ex) {
		return { };
	}
}

const apps = [{
	name: `sage-bot`,
	script: `./build/bot.mjs`,
	// args: `--max-memory-restart ${restartMB}M`,
	node_args: "--experimental-modules --es-module-specifier-resolution=node",

	append_env_to_name: true,
	wait_ready: true,
	env: getJson("env"),
	env_docker: { NODE_ENV: "dev" },
	env_dev: { NODE_ENV: "dev" },
	env_beta: { NODE_ENV: "beta" },
	env_stable: { NODE_ENV: "stable" },

	error_file: `./logs/bot.log`,
	out_file: `./logs/bot.log`,
	log_date_format: "YYYY-MM-DD",
	time: true,
}];

const deploy = {
	docker: getJson("deploy", "bot", "docker"),
	dev: getJson("deploy", "bot", "dev"),
	beta: getJson("deploy", "bot", "beta"),
	stable: getJson("deploy", "bot", "stable"),
}

module.exports = { apps, deploy };
