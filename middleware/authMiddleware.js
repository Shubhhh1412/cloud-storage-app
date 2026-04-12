const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {

    const authHeader = req.headers.authorization

    if (!authHeader) return res.status(401).send("No token")

    // Strip "Bearer " prefix if present
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()

    } catch (err) {

        console.error("Auth error:", err.message)
        res.status(401).send("Invalid token")

    }

}