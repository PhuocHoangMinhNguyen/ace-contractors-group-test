// Handle all the back-end functions with routes that start with "/api/lines"

const express = require('express');

const Line = require('../models/line');

const router = express.Router();

// Line.watch().then(result => {
//     console.log(result);
// })

// Add new line to database
router.post("", (req, res, next) => {
    const io = req.app.get('io');
    const line = new Line({
        item: req.body.item,
        rate: req.body.rate,
        quantity: req.body.quantity,
        amount: req.body.amount
    });
    line.save().then(createdLine => {
        io.emit("changed");
        res.status(201).json({
            message: "Line added successfully",
            lineId: createdLine._id
        });
    });
});

// Update line data from database
router.put("/:id", (req, res, next) => {
    const io = req.app.get('io');
    const line = new Line({
        _id: req.body.id,
        item: req.body.item,
        rate: req.body.rate,
        quantity: req.body.quantity,
        amount: req.body.amount
    });
    Line.updateOne({ _id: req.params.id }, line).then(() => {
        io.emit("changed");
        res.status(200).json({ message: 'Update successful!' });
    });
});

// Get lines data from database.
router.get("", (req, res, next) => {
    Line.find().then(documents => {
        res.status(200).json({
            message: "Lines fetched successfully!",
            lines: documents
        });
    });
});

// Delete line data from database
router.delete("/:id", (req, res, next) => {
    const io = req.app.get('io');
    Line.deleteOne({ _id: req.params.id }).then(() => {
        io.emit("changed");
        res.status(200).json({ message: 'Line deleted!' });
    });
});

module.exports = router;