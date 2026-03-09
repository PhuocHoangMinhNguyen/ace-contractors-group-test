// This file will hold the Express app, which is still a Node.js server-side app, 
// just taking advantage of the express features.

require('dotenv').config();
const path = require('path');
const express = require("express");
const mongoose = require("mongoose");

const linesRoutes = require("./routes/lines");

const app = express();

// Connect with MongoDB using mongoose.
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log('Connected to database')
}).catch(() => {
    console.log('Connection failed')
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/", express.static(path.join(__dirname, "prod")));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    next();
});

app.use('/api/lines', linesRoutes);

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "prod", "index.html"));
});

module.exports = app;