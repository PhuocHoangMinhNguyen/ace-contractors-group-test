// Mongoose works using schema, so this file is like a "blueprint"
// of how "Line" object looks like
const mongoose = require("mongoose");

const VALID_CATEGORIES = ['Labour', 'Materials', 'Equipment', 'Subcontractor', 'Overhead', 'Other'];

const lineSchema = mongoose.Schema({
    item: { type: String, required: true, index: true },
    rate: { type: Number, required: true },
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true },
    taxable: { type: Boolean, default: false },
    taxRate: { type: Number, default: 0 },
    category: { type: String, enum: VALID_CATEGORIES, default: 'Other' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true }
});

module.exports = mongoose.model('Line', lineSchema);
module.exports.VALID_CATEGORIES = VALID_CATEGORIES;