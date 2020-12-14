const path = require('path');
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const linesRoutes = require("./routes/lines");
const Line = require('./models/line');

const app = express();

// Connect with MongoDB using mongoose.
mongoose.connect(
    "mongodb+srv://max:ewKcW28TfrJXGpK3@cluster0.yt8ea.mongodb.net/ace-test?retryWrites=true&w=majority", // MongoDB URL
    { useNewUrlParser: true, useUnifiedTopology: true }
).then(() => {
    console.log('Connected to database')
}).catch(() => {
    console.log('Connection failed')
});

Line.watch().on('change', data => console.log(new Date(), data));

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
        "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    next();
});

app.use('/api/lines', linesRoutes);

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "prod", "index.html"));
});

module.exports = app;