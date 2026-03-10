// Handle all the back-end functions with routes that start with "/api/projects"

const express = require('express');

const Project = require('../models/project');
const Line = require('../models/line');
const Client = require('../models/client');
const { generateInvoicePdf } = require('../utils/pdf-generator');

const router = express.Router();

const VALID_STATUSES = ['draft', 'sent', 'approved', 'paid'];

// List all projects with optional status filter
router.get("", (req, res, next) => {
    const query = {};
    if (req.query.status) {
        query.status = req.query.status;
    }
    Project.find(query).then(projects => {
        res.status(200).json({ message: "Projects fetched successfully!", projects });
    }).catch(next);
});

// Create a new project
router.post("", (req, res, next) => {
    const io = req.app.get('io');
    const name = req.body.name;
    const clientId = req.body.clientId;
    const status = req.body.status;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'name is required' });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'status must be one of: ' + VALID_STATUSES.join(', ') });
    }

    const projectData = { name: name.trim() };
    if (clientId !== undefined) projectData.clientId = clientId;
    if (status !== undefined) projectData.status = status;

    const project = new Project(projectData);
    project.save().then(createdProject => {
        io.emit("projectAdded", createdProject);
        res.status(201).json({ message: "Project added successfully", projectId: createdProject._id });
    }).catch(next);
});

// Get a single project by ID
router.get("/:id", (req, res, next) => {
    Project.findById(req.params.id).then(project => {
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json({ message: "Project fetched successfully!", project });
    }).catch(next);
});

// Partially update a project
router.patch("/:id", (req, res, next) => {
    const io = req.app.get('io');
    const updateData = {};

    if (req.body.name !== undefined) {
        const name = req.body.name;
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'name must be a non-empty string' });
        }
        updateData.name = name.trim();
    }
    if (req.body.clientId !== undefined) {
        updateData.clientId = req.body.clientId;
    }
    if (req.body.status !== undefined) {
        if (!VALID_STATUSES.includes(req.body.status)) {
            return res.status(400).json({ message: 'status must be one of: ' + VALID_STATUSES.join(', ') });
        }
        updateData.status = req.body.status;
    }

    Project.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true }).then(project => {
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        io.emit("projectUpdated", project);
        res.status(200).json({ message: 'Project updated successfully!', project });
    }).catch(next);
});

// Delete a project and all its associated lines
router.delete("/:id", (req, res, next) => {
    const io = req.app.get('io');
    Project.findByIdAndDelete(req.params.id).then(deletedProject => {
        if (!deletedProject) {
            return Line.deleteMany({ projectId: req.params.id }).then(() => {
                io.emit("projectDeleted", { id: req.params.id });
                res.status(200).json({ message: 'Project deleted!' });
            });
        }
        return Line.deleteMany({ projectId: deletedProject._id }).then(() => {
            io.emit("projectDeleted", { id: deletedProject._id.toString() });
            res.status(200).json({ message: 'Project deleted!' });
        });
    }).catch(next);
});

// Generate and stream an invoice PDF for a project
router.get("/:id/invoice.pdf", (req, res, next) => {
    Project.findById(req.params.id).then(project => {
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        const clientPromise = project.clientId
            ? Client.findById(project.clientId)
            : Promise.resolve(null);
        return Promise.all([
            clientPromise,
            Line.find({ projectId: project._id })
        ]).then(([client, lines]) => {
            generateInvoicePdf(project, client, lines, res);
        });
    }).catch(next);
});

module.exports = router;
