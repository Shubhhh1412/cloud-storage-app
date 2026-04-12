const express  = require("express")
const bcrypt   = require("bcryptjs")
const jwt      = require("jsonwebtoken")
const fs       = require("fs")
const path     = require("path")

const router    = express.Router()
const USERS_PATH = path.join(__dirname, "../users.json")

// ── Helpers ──────────────────────────────────────────────
function loadUsers() {
    if (!fs.existsSync(USERS_PATH)) return []
    try { return JSON.parse(fs.readFileSync(USERS_PATH, "utf-8")) }
    catch { return [] }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2))
}

// ── Signup ───────────────────────────────────────────────
router.post("/signup", async (req, res) => {

    const { email, password } = req.body
    const users = loadUsers()

    const existing = users.find(u => u.email === email)
    if (existing) return res.status(400).send("User exists")

    const hashed = await bcrypt.hash(password, 10)
    users.push({ email, password: hashed })
    saveUsers(users)

    res.send("User created")
})

// ── Login ────────────────────────────────────────────────
router.post("/login", async (req, res) => {

    const { email, password } = req.body
    const users = loadUsers()

    const user = users.find(u => u.email === email)
    if (!user) return res.status(400).send("User not found")

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).send("Wrong password")

    const token = jwt.sign({ email }, process.env.JWT_SECRET)
    res.json({ token })
})

module.exports = router