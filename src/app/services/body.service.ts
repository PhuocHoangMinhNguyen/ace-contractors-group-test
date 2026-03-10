// Contains all the functions that can "communicate" with
// other components or back-end functions

import { Router } from '@angular/router';
import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Line } from './../model/line.model';

const BACKEND_URL = environment.apiUrl + "/lines/";

@Injectable({ providedIn: 'root' })
export class BodyService {
    isPrinting = false;
    private lines: Line[] = [];
    private linesUpdated = new Subject<Line[]>();
    private total: number = 0;

    constructor(private http: HttpClient, private router: Router) { }

    getLinesTotal(): number {
        return this.total;
    }

    // Get lines data from database.
    getLines(params?: { page?: number; pageSize?: number; sortField?: string; sortDir?: string; filter?: string; projectId?: string }) {
        let httpParams = new HttpParams();
        if (params) {
            if (params.page !== undefined) { httpParams = httpParams.set('page', String(params.page)); }
            if (params.pageSize !== undefined) { httpParams = httpParams.set('pageSize', String(params.pageSize)); }
            if (params.sortField) { httpParams = httpParams.set('sortField', params.sortField); }
            if (params.sortDir) { httpParams = httpParams.set('sortDir', params.sortDir); }
            if (params.filter) { httpParams = httpParams.set('filter', params.filter); }
            if (params.projectId) { httpParams = httpParams.set('projectId', params.projectId); }
        }

        const hasParams = params && httpParams.keys().length > 0;
        const request$ = hasParams
            ? this.http.get<{ message: string; lines: any; total?: number; page?: number; pageSize?: number }>(BACKEND_URL, { params: httpParams })
            : this.http.get<{ message: string; lines: any; total?: number; page?: number; pageSize?: number }>(BACKEND_URL);

        request$.pipe(map(lineData => {
            if (lineData.total !== undefined) {
                this.total = lineData.total;
            }
            return lineData.lines.map((line: any) => {
                const mapped: Line = {
                    item: line.item,
                    rate: line.rate,
                    quantity: line.quantity,
                    amount: line.amount,
                    id: line._id,
                };
                if (line.taxable !== undefined) { mapped.taxable = line.taxable; }
                if (line.taxRate !== undefined) { mapped.taxRate = line.taxRate; }
                if (line.category !== undefined) { mapped.category = line.category; }
                if (line.projectId !== undefined) { mapped.projectId = line.projectId; }
                return mapped;
            });
        })).subscribe({
            next: transformedLines => {
                this.lines = transformedLines;
                this.linesUpdated.next([...this.lines]);
            },
            error: (err) => console.error('Failed to fetch lines:', err)
        });
    };

    getLineUpdateListener() {
        return this.linesUpdated.asObservable();
    };

    // Add a new line to the database
    addLine(item: string, rate: number, quantity: number, extras?: { category?: string; taxable?: boolean; taxRate?: number; projectId?: string | null }) {
        const found = this.lines.find(line => line.item === item.trim());

        if (found !== null && found !== undefined) {
            let updateQuantity = found.quantity + quantity;
            this.updateLine(found.id, found.item, found.rate, updateQuantity);
        } else {
            const line: Line = { id: null, item: item.trim(), rate: rate, quantity: quantity, amount: rate * quantity };
            const body: any = { ...line };
            if (extras) {
                if (extras.category !== undefined) { body.category = extras.category; }
                if (extras.taxable !== undefined) { body.taxable = extras.taxable; }
                if (extras.taxRate !== undefined) { body.taxRate = extras.taxRate; }
                if (extras.projectId != null) { body.projectId = extras.projectId; }
            }
            this.http.post<{ message: string, lineId: string }>(BACKEND_URL, body)
                .subscribe({
                    next: responseData => {
                        const id = responseData.lineId;
                        line.id = id;
                        if (extras) {
                            if (extras.category !== undefined) { line.category = extras.category as any; }
                            if (extras.taxable !== undefined) { line.taxable = extras.taxable; }
                            if (extras.taxRate !== undefined) { line.taxRate = extras.taxRate; }
                            if (extras.projectId != null) { line.projectId = extras.projectId; }
                        }
                        this.lines.push(line);
                        this.linesUpdated.next([...this.lines]);
                    },
                    error: (err) => console.error('Failed to add line:', err)
                });
        };
    };

    updateLine(id: string, item: string, rate: number, quantity: number, extras?: { taxable?: boolean; taxRate?: number; category?: string }) {
        const line: Line = { id: id, item: item.trim(), rate: rate, quantity: quantity, amount: rate * quantity };
        const body: any = { ...line };
        if (extras) {
            if (extras.taxable !== undefined) { body.taxable = extras.taxable; }
            if (extras.taxRate !== undefined) { body.taxRate = extras.taxRate; }
            if (extras.category !== undefined) { body.category = extras.category; }
        }
        this.http.put(BACKEND_URL + id, body).subscribe({
            next: () => {
                const updatedLines = [...this.lines];
                const oldLineIndex = updatedLines.findIndex(p => p.id === line.id);
                if (extras) {
                    if (extras.taxable !== undefined) { line.taxable = extras.taxable; }
                    if (extras.taxRate !== undefined) { line.taxRate = extras.taxRate; }
                    if (extras.category !== undefined) { line.category = extras.category as any; }
                }
                updatedLines[oldLineIndex] = line;
                this.lines = updatedLines;
                this.linesUpdated.next([...this.lines]);
            },
            error: (err) => console.error('Failed to update line:', err)
        });
    };

    // Delete a line from the database (uses ID in URL)
    deleteLine(lineId: string, item: string) {
        this.http.delete(BACKEND_URL + lineId).subscribe({
            next: () => {
                const updatedLines = this.lines.filter(line => line.id !== lineId);
                this.lines = updatedLines;
                this.linesUpdated.next([...this.lines]);
            },
            error: (err) => console.error('Failed to delete line:', err)
        });
    };

    // Update local state from socket events without an HTTP refetch
    handleLineAdded(lineData: any) {
        if (this.lines.some(l => l.id === lineData._id)) { return; }
        const line: Line = {
            id: lineData._id,
            item: lineData.item,
            rate: lineData.rate,
            quantity: lineData.quantity,
            amount: lineData.amount,
        };
        if (lineData.taxable !== undefined) { line.taxable = lineData.taxable; }
        if (lineData.taxRate !== undefined) { line.taxRate = lineData.taxRate; }
        if (lineData.category !== undefined) { line.category = lineData.category; }
        if (lineData.projectId !== undefined) { line.projectId = lineData.projectId; }
        this.lines = [...this.lines, line];
        this.linesUpdated.next(this.lines);
    };

    handleLineUpdated(lineData: any) {
        const id = lineData._id || lineData.id;
        const index = this.lines.findIndex(l => l.id === id);
        if (index === -1) { return; }
        const updated: Line = { id, item: lineData.item, rate: lineData.rate, quantity: lineData.quantity, amount: lineData.amount };
        if (lineData.taxable !== undefined) { updated.taxable = lineData.taxable; }
        if (lineData.taxRate !== undefined) { updated.taxRate = lineData.taxRate; }
        if (lineData.category !== undefined) { updated.category = lineData.category; }
        if (lineData.projectId !== undefined) { updated.projectId = lineData.projectId; }
        this.lines = [...this.lines.slice(0, index), updated, ...this.lines.slice(index + 1)];
        this.linesUpdated.next(this.lines);
    };

    handleLineDeleted(payload: { id: string; item: string | null }) {
        this.lines = this.lines.filter(l => l.id !== payload.id);
        this.linesUpdated.next(this.lines);
    };

    // Loading report.
    printDocument() {
        this.isPrinting = true;
        this.router.navigate(['/', {
            outlets: { 'print': ['report'] }
        }]);
    };

    // When the report is ready, show a new window allowing user to print the report
    onDataReady() {
        setTimeout(() => {
            window.print();
            this.isPrinting = false;
            this.router.navigate([{ outlets: { print: null } }]);
        });
    };
};
