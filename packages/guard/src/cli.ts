import { mainPublic } from "../../../lib/guard/cli-public";

const code = mainPublic(process.argv.slice(2));
process.exit(code);
