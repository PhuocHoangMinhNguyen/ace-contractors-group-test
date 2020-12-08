const mongoose = require("mongoose");

const lineSchema = mongoose.Schema({
    item: { type: String, required: true },
    rate: { type: Number, required: true },
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true }
})

module.exports = mongoose.model('Line', lineSchema);