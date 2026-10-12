/**
 * Portable local PostgreSQL for development (no Docker / system install needed).
 *
 *   npm run db          -> starts Postgres on PG_PORT (default 5432), data in ./.pgdata
 *
 * Credentials come from env (defaults are for LOCAL DEV ONLY):
 *   PG_USER=postgres PG_PASSWORD=postgres PG_PORT=5432 PG_DATABASE=ds_wardrobe
 *
 * Prefer `docker compose up -d` at the repo root if Docker is available.
 */
import EmbeddedPostgres from "embedded-postgres"
import { existsSync } from "node:fs"
import net from "node:net"
import { fileURLToPath } from "node:url"
import path from "node:path"

const here = path.dirname(fileURLToPath(import.meta.url))
const databaseDir = path.join(here, ".pgdata")

const user = process.env.PG_USER ?? "postgres"
const password = process.env.PG_PASSWORD ?? "postgres"
const port = Number(process.env.PG_PORT ?? 5432)
const database = process.env.PG_DATABASE ?? "ds_wardrobe"

// If something already listens on the port (e.g. a previous run that was not
// stopped cleanly), reuse it instead of failing with a cryptic error.
const portInUse = await new Promise((resolve) => {
  const socket = net.connect({ port, host: "127.0.0.1" })
  socket.once("connect", () => {
    socket.destroy()
    resolve(true)
  })
  socket.once("error", () => resolve(false))
})
if (portInUse) {
  console.log(`[dev-db] port ${port} is already in use - PostgreSQL is probably already running. Nothing to do.`)
  process.exit(0)
}

const pg = new EmbeddedPostgres({
  databaseDir,
  user,
  password,
  port,
  persistent: true,
  // Force UTF-8: on Windows initdb otherwise inherits the ANSI code page (WIN1252)
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: () => {},
})

const fresh = !existsSync(path.join(databaseDir, "PG_VERSION"))
if (fresh) {
  console.log("[dev-db] initialising new cluster in", databaseDir)
  await pg.initialise()
}

await pg.start()

if (fresh) {
  await pg.createDatabase(database)
  console.log(`[dev-db] created database "${database}"`)
}

console.log(`[dev-db] PostgreSQL ready: postgres://${user}:***@localhost:${port}/${database}`)
console.log("[dev-db] press Ctrl+C to stop")

const shutdown = async () => {
  console.log("\n[dev-db] stopping…")
  await pg.stop()
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
setInterval(() => {}, 1 << 30)
