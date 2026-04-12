/**
 * CloudSync — Local File Sync Agent
 * ──────────────────────────────────
 * Watches a local folder and automatically syncs any
 * file additions or changes to your CloudSync S3 storage.
 *
 * Usage:
 *   node sync-agent.js <email> <password> [folder]
 *
 * Example:
 *   node sync-agent.js test@test.com password123 ./sync-folder
 *
 * How it works:
 *   1. Logs in to get a JWT token
 *   2. Watches the local sync folder for any file changes
 *   3. When a file is added or modified → auto-uploads to S3
 *   4. When a file is deleted locally → removes it from S3
 */

const chokidar = require("chokidar")
const fs = require("fs")
const path = require("path")

// ── Config ──────────────────────────────────────────────────────────
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000"
const email      = process.argv[2]
const password   = process.argv[3]
const SYNC_DIR   = path.resolve(process.argv[4] || "./sync-folder")

if (!email || !password) {
    console.error("\n  ❌  Usage: node sync-agent.js <email> <password> [folder]\n")
    process.exit(1)
}

// ── State ────────────────────────────────────────────────────────────
let token = null

// ── Helpers ─────────────────────────────────────────────────────────
function log(msg)  { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`) }
function warn(msg) { console.warn(`[${new Date().toLocaleTimeString()}] ⚠️  ${msg}`) }

// ── Auth ─────────────────────────────────────────────────────────────
async function login() {
    log(`🔑  Logging in as ${email}...`)

    const res = await fetch(`${SERVER_URL}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password })
    })

    if (!res.ok) {
        const text = await res.text()
        console.error(`\n  ❌  Login failed: ${text}\n`)
        process.exit(1)
    }

    const data = await res.json()
    token = data.token
    log("✅  Logged in successfully")
}

// ── Upload a file to CloudSync ────────────────────────────────────────
async function uploadFile(filepath) {
    const filename = path.basename(filepath)

    try {
        const buffer = fs.readFileSync(filepath)
        const blob   = new Blob([buffer])
        const fd     = new FormData()
        fd.append("file", blob, filename)

        const res = await fetch(`${SERVER_URL}/upload`, {
            method:  "POST",
            headers: { Authorization: "Bearer " + token },
            body:    fd
        })

        if (!res.ok) {
            warn(`Failed to sync "${filename}": ${await res.text()}`)
            return
        }

        const data = await res.json()

        if (data.isUpdate) {
            log(`🔄  Synced updated file: "${filename}"  (new version saved)`)
        } else {
            log(`☁️   Uploaded new file:   "${filename}"`)
        }

    } catch (err) {
        warn(`Error syncing "${filename}": ${err.message}`)
    }
}

// ── Delete a file from CloudSync ──────────────────────────────────────
async function deleteFile(filepath) {
    const filename = path.basename(filepath)

    try {
        const res = await fetch(`${SERVER_URL}/file/${encodeURIComponent(filename)}`, {
            method:  "DELETE",
            headers: { Authorization: "Bearer " + token }
        })

        if (!res.ok) {
            warn(`Failed to delete "${filename}" from cloud: ${await res.text()}`)
            return
        }

        log(`🗑️   Removed from cloud:  "${filename}"`)

    } catch (err) {
        warn(`Error deleting "${filename}": ${err.message}`)
    }
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {

    // Make sure sync folder exists
    if (!fs.existsSync(SYNC_DIR)) {
        fs.mkdirSync(SYNC_DIR, { recursive: true })
        log(`📁  Created sync folder: ${SYNC_DIR}`)
    }

    await login()

    console.log("\n" + "─".repeat(55))
    console.log(`  📂  Watching: ${SYNC_DIR}`)
    console.log(`  🌐  Server  : ${SERVER_URL}`)
    console.log("─".repeat(55))
    console.log("  Any file you add or edit here will automatically")
    console.log("  sync to your CloudSync storage on AWS S3.")
    console.log("  Press Ctrl+C to stop.")
    console.log("─".repeat(55) + "\n")

    const watcher = chokidar.watch(SYNC_DIR, {
        ignored:        /(^|[/\\])\../, // ignore hidden files (like .DS_Store)
        persistent:     true,
        ignoreInitial:  false,          // sync already-existing files on start
        usePolling:     true,           // Required on Windows for reliable change detection
        interval:       1000,           // Check every 1 second
        awaitWriteFinish: {             // Wait for file write to fully finish before uploading
            stabilityThreshold: 800,
            pollInterval:       200
        }
    })

    // File added
    watcher.on("add", filepath => {
        log(`➕  Detected new file:    "${path.basename(filepath)}"`)
        uploadFile(filepath)
    })

    // File modified
    watcher.on("change", filepath => {
        log(`✏️   Detected file change: "${path.basename(filepath)}"`)
        uploadFile(filepath)
    })

    // File deleted locally
    watcher.on("unlink", filepath => {
        log(`➖  Detected file delete: "${path.basename(filepath)}"`)
        deleteFile(filepath)
    })

    watcher.on("error", err => warn(`Watcher error: ${err}`))

    log("👀  Sync agent is running...")
}

main()
