const path = require('path');
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const Line = require('./models/line');

const app = express();

mongoose.connect(
    "", // MongoDB URL
    { useNewUrlParser: true, useUnifiedTopology: true }
).then(() => {
    console.log('Connected to database')
}).catch(() => {
    console.log('Connection failed')
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/", express.static(path.join(__dirname, "prod")));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, DELETE, OPTIONS"
    );
    next();
});

app.post("/api/lines", (req, res, next) => {
    const line = new Line({
        item: req.body.item
    });
    line.save().then(createdLine => {
        res.status(201).json({
            message: "Line added successfully",
            lineId: createdLine._id
        });
    });
});

app.get("/api/lines", (req, res, next) => {
    Line.find().then(documents => {
        res.status(200).json({
            message: "Lines fetched successfully!",
            lines: documents
        });
    });
});

app.delete("/api/lines/:id", (req, res, next) => {
    Line.deleteOne({ _id: req.params.id }).then(result => {
        console.log(result);
        res.status(200).json({ message: 'Line deleted!' });
    });
});

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "prod", "index.html"));
});

module.exports = app;