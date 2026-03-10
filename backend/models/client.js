// Client model: stores customer/client information
const mongoose = require("mongoose");

const clientSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true }
});

module.exports = mongoose.model('Client', clientSchema);
