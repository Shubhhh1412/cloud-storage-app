const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const AWS = require("aws-sdk")
const multer = require("multer")
const jwt = require("jsonwebtoken")
const http = require("http")
const { addVersion, getVersions, clearVersions } = require("./utils/versionStore")

dotenv.config()

const app = express()
const server = http.createServer(app)

app.use(cors())
app.use(express.json())
app.use(express.static("public"))

const upload = multer()

// AWS CONFIG
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
})

// ROUTES
app.use("/auth", require("./routes/auth"))
const authMiddleware = require("./middleware/authMiddleware")

// ─────────────────────────────────────────────
// UPLOAD (with sync detection)
// ─────────────────────────────────────────────
app.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {

    const email = req.user.email
    const filename = req.file.originalname
    const key = `${email}/${filename}`
    let isUpdate = false
    let oldMeta = null

    // Check if the file already exists in S3
    try {
        const head = await s3.headObject({
            Bucket: process.env.BUCKET_NAME,
            Key: key
        }).promise()

        // File exists — save old version metadata before overwriting
        isUpdate = true
        oldMeta = {
            size: head.ContentLength,
            etag: head.ETag
        }
        addVersion(email, filename, oldMeta)

    } catch (err) {
        // File doesn't exist yet — first upload, nothing to save
        if (err.code !== "NotFound" && err.statusCode !== 404) {
            console.error("headObject error:", err)
        }
    }

    // Upload (or overwrite) the file in S3
    const result = await s3.upload({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
    }).promise()

    res.json({
        message: isUpdate ? "File synced (updated)" : "File uploaded",
        isUpdate,
        filename,
        etag: result.ETag
    })
})

// ─────────────────────────────────────────────
// LIST FILES
// ─────────────────────────────────────────────
app.get("/files", authMiddleware, async (req, res) => {

    const data = await s3.listObjectsV2({
        Bucket: process.env.BUCKET_NAME,
        Prefix: `${req.user.email}/`
    }).promise()

    const files = (data.Contents || []).map(f => {
        const filename = f.Key.split("/")[1]
        const versions = getVersions(req.user.email, filename)
        return {
            ...f,
            filename,
            versionCount: versions.length,
            hasBeenUpdated: versions.length > 0
        }
    })

    res.json(files)
})

// ─────────────────────────────────────────────
// VERSION HISTORY for a file
// ─────────────────────────────────────────────
app.get("/versions/:name", authMiddleware, (req, res) => {
    const versions = getVersions(req.user.email, req.params.name)
    res.json(versions)
})

// ─────────────────────────────────────────────
// DOWNLOAD
// ─────────────────────────────────────────────
app.get("/download/:name", authMiddleware, async (req, res) => {

    const key      = `${req.user.email}/${req.params.name}`
    const filename = req.params.name

    try {
        // Get file metadata first so we can set Content-Type
        const head = await s3.headObject({
            Bucket: process.env.BUCKET_NAME,
            Key: key
        }).promise()

        // Force browser to download (not open) by setting Content-Disposition
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`)
        res.setHeader("Content-Type", head.ContentType || "application/octet-stream")
        res.setHeader("Content-Length", head.ContentLength)

        // Stream the file directly from S3 → client (no temp file needed)
        const stream = s3.getObject({
            Bucket: process.env.BUCKET_NAME,
            Key: key
        }).createReadStream()

        stream.on("error", (err) => {
            console.error("S3 stream error:", err)
            if (!res.headersSent) res.status(500).send("Download failed")
        })

        stream.pipe(res)

    } catch (err) {
        console.error("Download error:", err)
        res.status(404).send("File not found")
    }
})

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
app.delete("/file/:name", authMiddleware, async (req, res) => {

    await s3.deleteObject({
        Bucket: process.env.BUCKET_NAME,
        Key: `${req.user.email}/${req.params.name}`
    }).promise()

    // Also clear version history for this file
    clearVersions(req.user.email, req.params.name)

    res.send("Deleted")
})

// ─────────────────────────────────────────────
// SERVER
// ─────────────────────────────────────────────
server.listen(process.env.PORT, () => {
    console.log("Server running on port", process.env.PORT)
})