// Handle all the back-end functions with routes that start with "/api/clients"

const express = require('express');

const Client = require('../models/client');

const router = express.Router();

// List all clients
router.get("", (req, res, next) => {
    Client.find().then(clients => {
        res.status(200).json({ message: "Clients fetched successfully!", clients });
    }).catch(next);
});

// Create a new client
router.post("", (req, res, next) => {
    const name = req.body.name;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'name is required' });
    }

    const clientData = { name: name.trim() };
    if (req.body.email !== undefined) clientData.email = req.body.email;
    if (req.body.phone !== undefined) clientData.phone = req.body.phone;
    if (req.body.address !== undefined) clientData.address = req.body.address;

    const client = new Client(clientData);
    client.save().then(createdClient => {
        res.status(201).json({ message: "Client added successfully", clientId: createdClient._id });
    }).catch(next);
});

// Get a single client by ID
router.get("/:id", (req, res, next) => {
    Client.findById(req.params.id).then(client => {
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.status(200).json({ message: "Client fetched successfully!", client });
    }).catch(next);
});

// Partially update a client
router.patch("/:id", (req, res, next) => {
    const updateData = {};

    if (req.body.name !== undefined) {
        const name = req.body.name;
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'name must be a non-empty string' });
        }
        updateData.name = name.trim();
    }
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.address !== undefined) updateData.address = req.body.address;

    Client.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true }).then(client => {
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.status(200).json({ message: 'Client updated successfully!', client });
    }).catch(next);
});

// Delete a client
router.delete("/:id", (req, res, next) => {
    Client.findByIdAndDelete(req.params.id).then(deletedClient => {
        if (!deletedClient) {
            return res.status(404).json({ message: 'Client not found' });
        }
        res.status(200).json({ message: 'Client deleted!' });
    }).catch(next);
});

module.exports = router;
