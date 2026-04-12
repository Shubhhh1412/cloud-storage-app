const fs = require("fs")
const path = require("path")

const STORE_PATH = path.join(__dirname, "../versions.json")

function loadStore() {
    if (!fs.existsSync(STORE_PATH)) return {}
    try {
        return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"))
    } catch {
        return {}
    }
}

function saveStore(data) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2))
}

// Add a version entry for a file
function addVersion(email, filename, meta) {
    const store = loadStore()
    const key = `${email}::${filename}`
    if (!store[key]) store[key] = []
    store[key].unshift({
        version: (store[key].length + 1),
        uploadedAt: new Date().toISOString(),
        size: meta.size,
        etag: meta.etag || null
    })
    saveStore(store)
}

// Get version history for a file
function getVersions(email, filename) {
    const store = loadStore()
    const key = `${email}::${filename}`
    return store[key] || []
}

// Clear version history for a file (e.g., after delete)
function clearVersions(email, filename) {
    const store = loadStore()
    const key = `${email}::${filename}`
    delete store[key]
    saveStore(store)
}

module.exports = { addVersion, getVersions, clearVersions }
