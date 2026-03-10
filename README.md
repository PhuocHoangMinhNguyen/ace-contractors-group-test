# ACE Contractors Group — Project Management App

A full-featured project management and data entry web application built for ACE Contractors Group Pty. Ltd. Users can manage projects, clients, and line items (labour, materials, equipment, etc.), with real-time multi-client sync, PDF invoice generation, and a live running total with tax calculations.

## Table of Contents

1. [Screenshots](#screenshots)
2. [Technologies and Framework Used](#technologies-and-framework-used)
3. [Features](#features)
4. [Installation](#installation)
5. [How to use?](#how-to-use)
6. [Author](#author)

## Screenshots
<img src="https://github.com/PhuocHoangMinhNguyen/ace-contractors-group-test/blob/master/screenshots/1.png" width="500" /> <img src="https://github.com/PhuocHoangMinhNguyen/ace-contractors-group-test/blob/master/screenshots/2.png" width="500" />

## Technologies and Framework Used
- **MEAN Stack** — MongoDB Atlas + Express.js 5 + Angular 21 + Node.js
- **Angular Material** — UI components (table, forms, dialogs, pagination)
- **Socket.io** — Real-time multi-client synchronisation
- **PDFKit** — Server-side PDF invoice generation
- **RxJS** — Reactive state management
- **date-fns** — Date formatting
- **Helmet / express-rate-limit** — Security hardening
- **Deployment:** AWS Elastic Beanstalk

## Features

- **Multi-Project Support** — Create and manage multiple projects; filter line items by project
- **Client Management** — Store client details (name, email, phone, address) and link to projects
- **Line Item Entry** — Add, edit (inline), and delete line items with item name, rate, quantity, and auto-calculated amount
- **Cost Codes** — Categorise lines as Labour, Materials, Equipment, Subcontractor, Overhead, or Other
- **Tax Calculations** — Mark lines as taxable with a configurable tax rate; footer shows Subtotal / Tax / Grand Total
- **Estimate-to-Invoice Workflow** — Project status transitions: Draft → Sent → Approved → Paid
- **PDF Invoice Export** — Generate and download a formatted PDF invoice per project
- **Server-side Pagination, Sorting & Filtering** — Efficient table navigation for large datasets
- **Real-time Sync** — All connected clients update instantly via Socket.io
- **Print Report** — Print a formatted report of the current table view
- **PWA Support** — Angular Service Worker for offline capability

## Installation

**Live production app:** http://ace-contractors-prod.eba-kz2ssxnw.ap-southeast-2.elasticbeanstalk.com/

### Local Development

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with your MongoDB Atlas connection string:
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   ```

3. Start the backend server:
   ```bash
   npm run start:server
   ```

4. Start the Angular dev server (in a separate terminal):
   ```bash
   npm start
   ```

5. Open http://localhost:4200 in your browser.

### Available Scripts

| Command | Description |
|---|---|
| `npm start` | Angular dev server at http://localhost:4200 |
| `npm run start:server` | Express backend at http://localhost:3000 |
| `npm run build` | Production build (output to `backend/prod/`) |
| `npm test` | Run Jasmine/Karma frontend unit tests |
| `npm run test:server` | Run Jest backend unit tests |
| `npm run test:all` | Run all tests (frontend + backend) |
| `npm run lint` | Run TSLint |

## How to use?

Check out the [User Manual](https://drive.google.com/file/d/1rCnlY_QlXTIxGZ7ovCpVE-jBLlwYFV44/view?usp=sharing)

## Author

**Phuoc Hoang Minh Nguyen** - *Full-stack Web Developer* - [PhuocHoangMinhNguyen](https://github.com/PhuocHoangMinhNguyen)
