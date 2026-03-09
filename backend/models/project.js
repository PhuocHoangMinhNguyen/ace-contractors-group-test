// Project model: organizes line items by job
const mongoose = require("mongoose");

const projectSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    status: { type: String, enum: ['draft', 'sent', 'approved', 'paid'], default: 'draft' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);
