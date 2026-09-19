import { getArgs } from "./internal/getArgs.js";
import { writeEnvJson } from "./internal/writeEnvJson.js";
async function main() {
    const argData = {
        where: {
            prompt: "Where:",
            values: ["local", "docker", "dev", "beta", "stable"],
            defValue: "local"
        },
    };
    const args = await getArgs(argData);
    await writeEnvJson(args);
}
main();
