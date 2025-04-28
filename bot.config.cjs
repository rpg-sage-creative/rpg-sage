
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
	env: { ...getJson("env"), ...getJson("env", "bot") },
	env_dev: { NODE_ENV: "dev", ...getJson("env", "bot", "dev") },
	env_beta: { NODE_ENV: "beta", ...getJson("env", "bot", "beta") },
	env_stable: { NODE_ENV: "stable", ...getJson("env", "bot", "stable") },

	error_file: `./logs/bot.log`,
	out_file: `./logs/bot.log`,
	log_date_format: "YYYY-MM-DD",
	time: true,
}];

const deploy = {
	dev: { ...getJson("deploy"), ...getJson("deploy", "bot"), ...getJson("deploy", "dev") },
	beta: { ...getJson("deploy"), ...getJson("deploy", "bot"), ...getJson("deploy", "beta") },
	stable: { ...getJson("deploy"), ...getJson("deploy", "bot"), ...getJson("deploy", "stable") },
}

module.exports = { apps, deploy };
