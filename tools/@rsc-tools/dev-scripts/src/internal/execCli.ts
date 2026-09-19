import { exec } from "node:child_process";

type Options = { cwd?:string; };

export async function execCli(cmd: string, ...args: string[]): Promise<string>;
export async function execCli(cmd: string, opts: Options): Promise<string>;
export async function execCli(...args: unknown[]): Promise<string> {
	let cmd: string;
	let opts: Options | undefined;

	if (args[1] && typeof(args[1]) === "object") {
		cmd = args.shift() as string;
		opts = args.shift() as Options;
	}else {
		cmd = args.join(" ");
	}

	return new Promise((resolve, reject) => {
		exec(cmd, opts, (error, stdout, stderr) => {
			if (error) reject(error);
			else if (stderr) reject(stderr);
			else resolve(stdout.toString());
		});
	});
}
