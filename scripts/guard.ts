/**
 * Thin Guard CLI entry — core logic lives in lib/guard/.
 *
 *   npm run guard -- [path]
 *   npm run guard -- --internal [path]
 *   npm run guard -- [path] --claims <file.json>
 */
import { main } from "../lib/guard/cli";

const code = main(process.argv.slice(2));
process.exit(code);
