import { spawn } from "node:child_process";
export async function execCli(cmd, ...args) {
    const proc = spawn(cmd, args, { stdio: 'inherit' });
    await new Promise((resolve, reject) => {
        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`${cmd} compose exited with code ${code}`));
            }
        });
        proc.on('error', (error) => {
            reject(error);
        });
    });
}
