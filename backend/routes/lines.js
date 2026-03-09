// Handle all the back-end functions with routes that start with "/api/lines"

const express = require('express');

const Line = require('../models/line');
const { VALID_CATEGORIES } = require('../models/line');

const router = express.Router();

// Add new line to database
router.post("", (req, res, next) => {
    const io = req.app.get('io');
    const item = req.body.item;
    const rate = Number(req.body.rate);
    const quantity = Number(req.body.quantity);
    const taxable = req.body.taxable !== undefined ? Boolean(req.body.taxable) : false;
    const taxRate = req.body.taxRate !== undefined ? Number(req.body.taxRate) : 0;
    const category = req.body.category !== undefined ? req.body.category : 'Other';

    if (!item || typeof item !== 'string' || item.trim() === '') {
        return res.status(400).json({ message: 'item is required' });
    }
    if (isNaN(rate) || rate < 0) {
        return res.status(400).json({ message: 'rate must be a non-negative number' });
    }
    if (isNaN(quantity) || quantity < 0) {
        return res.status(400).json({ message: 'quantity must be a non-negative number' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'category must be one of: ' + VALID_CATEGORIES.join(', ') });
    }
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        return res.status(400).json({ message: 'taxRate must be a number between 0 and 100' });
    }

    const amount = rate * quantity;
    const lineData = { item: item.trim(), rate, quantity, amount, taxable, taxRate, category };
    if (req.body.projectId) { lineData.projectId = req.body.projectId; }
    const line = new Line(lineData);
    line.save().then(createdLine => {
        io.emit("added", createdLine);
        res.status(201).json({
            message: "Line added successfully",
            lineId: createdLine._id
        });
    }).catch(next);
});

// Update line data from database
router.put("/:id", (req, res, next) => {
    const io = req.app.get('io');
    const item = req.body.item;
    const rate = Number(req.body.rate);
    const quantity = Number(req.body.quantity);
    const taxable = req.body.taxable !== undefined ? Boolean(req.body.taxable) : undefined;
    const taxRate = req.body.taxRate !== undefined ? Number(req.body.taxRate) : undefined;
    const category = req.body.category !== undefined ? req.body.category : undefined;

    if (!item || typeof item !== 'string' || item.trim() === '') {
        return res.status(400).json({ message: 'item is required' });
    }
    if (isNaN(rate) || rate < 0) {
        return res.status(400).json({ message: 'rate must be a non-negative number' });
    }
    if (isNaN(quantity) || quantity < 0) {
        return res.status(400).json({ message: 'quantity must be a non-negative number' });
    }
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: 'category must be one of: ' + VALID_CATEGORIES.join(', ') });
    }
    if (taxRate !== undefined && (isNaN(taxRate) || taxRate < 0 || taxRate > 100)) {
        return res.status(400).json({ message: 'taxRate must be a number between 0 and 100' });
    }

    const amount = rate * quantity;
    const updateData = { item: item.trim(), rate, quantity, amount };
    if (taxable !== undefined) updateData.taxable = taxable;
    if (taxRate !== undefined) updateData.taxRate = taxRate;
    if (category !== undefined) updateData.category = category;

    Line.updateOne({ _id: req.params.id }, { $set: updateData }).then((result) => {
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Line not found' });
        }
        io.emit("updated", { _id: req.params.id, ...updateData });
        res.status(200).json({ message: 'Update successful!' });
    }).catch(next);
});

// Get lines data from database.
// If page or pageSize query params are provided, paginate; otherwise return all (for backward compat).
router.get("", (req, res, next) => {
    const hasPagination = req.query.page !== undefined || req.query.pageSize !== undefined;
    const filter = req.query.filter;
    const projectId = req.query.projectId;
    const sortField = req.query.sortField || '_id';
    const sortDir = req.query.sortDir === 'desc' ? -1 : 1;

    const query = {};
    if (filter) {
        query.item = { $regex: filter, $options: 'i' };
    }
    if (projectId) {
        query.projectId = projectId;
    }

    const sortObj = { [sortField]: sortDir };

    if (!hasPagination) {
        Line.find(query).sort(sortObj).then(documents => {
            res.status(200).json({
                message: "Lines fetched successfully!",
                lines: documents
            });
        }).catch(next);
    } else {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 50;
        const skip = (page - 1) * pageSize;

        Promise.all([
            Line.find(query).sort(sortObj).skip(skip).limit(pageSize),
            Line.countDocuments(query)
        ]).then(([documents, total]) => {
            res.status(200).json({
                message: "Lines fetched successfully!",
                lines: documents,
                total,
                page,
                pageSize
            });
        }).catch(next);
    }
});

// Delete line data from database
router.delete("/:id", (req, res, next) => {
    const io = req.app.get('io');
    Line.findByIdAndDelete(req.params.id).then((deletedLine) => {
        io.emit("deleted", {
            id: deletedLine ? deletedLine._id.toString() : req.params.id,
            item: deletedLine ? deletedLine.item : null
        });
        res.status(200).json({ message: 'Line deleted!' });
    }).catch(next);
});

module.exports = router;
