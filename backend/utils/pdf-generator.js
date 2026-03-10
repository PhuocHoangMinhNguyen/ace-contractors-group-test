const PDFDocument = require('pdfkit');

/**
 * Generate an invoice PDF for a project.
 * @param {object} project - { name, status, createdAt }
 * @param {object|null} client - { name, email, phone, address } or null
 * @param {Array} lines - array of line items { item, rate, quantity, amount, category, taxable, taxRate }
 * @param {object} res - Express response object (PDF is streamed to it)
 */
function generateInvoicePdf(project, client, lines, res) {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${project.name.replace(/\s+/g, '-')}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('ACE CONTRACTORS GROUP', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Invoice', { align: 'center' });
    doc.moveDown();

    // Project info
    doc.fontSize(12).font('Helvetica-Bold').text(`Project: ${project.name}`);
    doc.font('Helvetica').text(`Status: ${project.status.toUpperCase()}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-AU')}`);
    doc.moveDown();

    // Client info
    if (client) {
        doc.font('Helvetica-Bold').text('Bill To:');
        doc.font('Helvetica').text(client.name);
        if (client.email) doc.text(client.email);
        if (client.phone) doc.text(client.phone);
        if (client.address) doc.text(client.address);
        doc.moveDown();
    }

    // Table header
    doc.font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Item', 50, tableTop);
    doc.text('Category', 220, tableTop);
    doc.text('Rate', 310, tableTop, { width: 70, align: 'right' });
    doc.text('Qty', 390, tableTop, { width: 40, align: 'right' });
    doc.text('Amount', 445, tableTop, { width: 90, align: 'right' });
    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
    doc.moveDown();

    // Table rows
    let subtotal = 0;
    let taxTotal = 0;

    doc.font('Helvetica');
    lines.forEach(line => {
        const y = doc.y;
        doc.text(line.item, 50, y, { width: 160 });
        doc.text(line.category || 'Other', 220, y, { width: 80 });
        doc.text(`$${Number(line.rate).toFixed(2)}`, 310, y, { width: 70, align: 'right' });
        doc.text(String(line.quantity), 390, y, { width: 40, align: 'right' });
        doc.text(`$${Number(line.amount).toFixed(2)}`, 445, y, { width: 90, align: 'right' });
        doc.moveDown(0.5);
        subtotal += Number(line.amount) || 0;
        if (line.taxable && line.taxRate) {
            taxTotal += Number(line.amount) * Number(line.taxRate) / 100;
        }
    });

    // Footer totals
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    const grandTotal = subtotal + taxTotal;

    doc.font('Helvetica').text('Subtotal:', 390, doc.y, { width: 55, align: 'right' });
    doc.text(`$${subtotal.toFixed(2)}`, 445, doc.y - doc.currentLineHeight(), { width: 90, align: 'right' });
    doc.moveDown(0.5);

    if (taxTotal > 0) {
        doc.text('Tax:', 390, doc.y, { width: 55, align: 'right' });
        doc.text(`$${taxTotal.toFixed(2)}`, 445, doc.y - doc.currentLineHeight(), { width: 90, align: 'right' });
        doc.moveDown(0.5);
    }

    doc.font('Helvetica-Bold').text('GRAND TOTAL:', 350, doc.y, { width: 95, align: 'right' });
    doc.text(`$${grandTotal.toFixed(2)}`, 445, doc.y - doc.currentLineHeight(), { width: 90, align: 'right' });

    doc.end();
}

module.exports = { generateInvoicePdf };
