// Sets Convex Auth secrets on a deployment without printing them.
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const prod = process.argv.includes("--prod");
const siteUrl = process.argv.find((a) => a.startsWith("--site="))?.slice(7);
const run = (...args) => {
  const r = spawnSync(process.execPath, ["node_modules/convex/bin/main.js", "env", ...(prod ? ["--prod"] : []), ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout).trim().split("\n").pop());
};
const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = (await exportPKCS8(keys.privateKey)).trimEnd().replace(/\n/g, " ");
const jwks = JSON.stringify({ keys: [{ use: "sig", ...(await exportJWK(keys.publicKey)) }] });
run("set", "JWT_PRIVATE_KEY", "--", privateKey);
run("set", "JWKS", jwks);
run("set", "SITE_URL", siteUrl);

// One shared demo password, kept in the gitignored .env.demo so the team can read it.
let pw;
if (existsSync(".env.demo")) pw = /DEMO_PASSWORD=(.+)/.exec(readFileSync(".env.demo", "utf8"))?.[1]?.trim();
if (!pw) {
  pw = "ice-" + randomBytes(6).toString("base64url");
  writeFileSync(".env.demo", `# Shared password for the demo accounts (goa@, ship@, maitri@, bharati@, field@himsetu.demo)\nDEMO_PASSWORD=${pw}\n`);
}
run("set", "DEMO_PASSWORD", pw);
console.log(`auth env set on ${prod ? "prod" : "dev"} (site ${siteUrl})`);
