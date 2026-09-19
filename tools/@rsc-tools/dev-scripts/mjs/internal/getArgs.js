import { promptUser } from "./promptUser.js";
export async function getArgs(argData) {
    const args = {};
    const cliArgs = process.argv.slice(2);
    const noPrompt = cliArgs.includes("--noPrompt");
    const argKeys = Object.keys(argData);
    for (let i = 0; i < argKeys.length; i++) {
        const argKey = argKeys[i];
        const { argIndex, prompt, values } = argData[argKey];
        let cliArg = cliArgs.find((arg, cliIndex) => (!argIndex || argIndex === cliIndex) && values.includes(arg));
        if (cliArg) {
            console.log(prompt + " " + cliArg);
        }
        else if (!noPrompt) {
            cliArg = await promptUser(argData[argKey]).catch(console.error) ?? undefined;
        }
        args[argKey] = cliArg;
    }
    return args;
}
