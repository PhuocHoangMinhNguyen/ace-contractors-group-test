// This file will hold the Express app, which is still a Node.js server-side app,
// just taking advantage of the express features.

require('dotenv').config();
const path = require('path');
const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const linesRoutes = require("./routes/lines");
const projectsRoutes = require("./routes/projects");
const clientsRoutes = require("./routes/clients");

const app = express();

// Connect with MongoDB using mongoose. Exit if connection fails.
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('Connected to database')
}).catch((err) => {
    console.error('Connection failed:', err);
    process.exit(1);
});

// Gzip compression for all responses (~70% bandwidth reduction)
app.use(compression());

// Security headers (CSP disabled — Angular inline onload attrs conflict with strict CSP)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS must be registered before static and route middleware
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';
app.use((req, res, next) => {
    if (req.headers.origin === CORS_ORIGIN) {
        res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
    }
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

// Rate limiting: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files with long-lived cache for hashed assets; no-cache for index.html
app.use("/", express.static(path.join(__dirname, "prod"), {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

app.use('/api/lines', linesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/clients', clientsRoutes);

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "prod", "index.html"), (err) => {
        if (err) next(err);
    });
});

module.exports = app;
