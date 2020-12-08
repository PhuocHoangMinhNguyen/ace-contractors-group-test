const express = require('express');

const Line = require('../models/line');

const router = express.Router();

router.post("", (req, res, next) => {
    const line = new Line({
        item: req.body.item,
        rate: req.body.rate,
        quantity: req.body.quantity,
        amount: req.body.amount
    });
    line.save().then(createdLine => {
        res.status(201).json({
            message: "Line added successfully",
            lineId: createdLine._id
        });
    });
});

router.get("", (req, res, next) => {
    Line.find().then(documents => {
        res.status(200).json({
            message: "Lines fetched successfully!",
            lines: documents
        });
    });
});

router.delete("/:id", (req, res, next) => {
    Line.deleteOne({ _id: req.params.id }).then(result => {
        console.log(result);
        res.status(200).json({ message: 'Line deleted!' });
    });
});

module.exports = router;