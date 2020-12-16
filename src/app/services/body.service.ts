// Contains all the functions that can "communicate" with 
// other components or back-end functions

import { Router } from '@angular/router';
import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
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

    constructor(private http: HttpClient, private router: Router) { }

    // Get lines data from database.
    getLines() {
        this.http.get<{ message: string, lines: any }>(BACKEND_URL)
            .pipe(map(lineData => {
                return lineData.lines.map(line => {
                    return {
                        item: line.item,
                        rate: line.rate,
                        quantity: line.quantity,
                        amount: line.amount,
                        id: line._id
                    };
                });
            })).subscribe(transformedLines => {
                this.lines = transformedLines;
                this.linesUpdated.next([...this.lines]);
            });
    };

    getLineUpdateListener() {
        return this.linesUpdated.asObservable();
    };

    // Add a new line to the database
    addLine(item: string, rate: number, quantity: number) {
        let found = null;
        // Check if "item name" already exists
        this.lines.forEach(line => {
            if (line.item == item) {
                found = line
            };
        });

        if (found != null) {
            let updateRate = found.rate + rate;
            let updateQuantity = found.quantity + quantity;
            this.updateLine(found.id, found.item, updateRate, updateQuantity);
        } else {
            const line: Line = { id: null, item: item, rate: rate, quantity: quantity, amount: rate * quantity };
            this.http.post<{ message: string, lineId: string }>(BACKEND_URL, line)
                .subscribe(responseData => {
                    const id = responseData.lineId;
                    line.id = id;
                    this.lines.push(line);
                    this.linesUpdated.next([...this.lines]);
                });
        };
    };

    updateLine(id: string, item: string, rate: number, quantity: number) {
        const line: Line = { id: id, item: item, rate: rate, quantity: quantity, amount: rate * quantity };
        this.http.put(BACKEND_URL + id, line).subscribe(() => {
            const updatedLines = [...this.lines];
            const oldLineIndex = updatedLines.findIndex(p => p.id === line.id);
            updatedLines[oldLineIndex] = line;
            this.lines = updatedLines;
            this.linesUpdated.next([...this.lines]);
        });
    };

    // Delete a line from the database
    deleteLine(lineId: string, item: string) {
        this.http.delete(BACKEND_URL + item).subscribe(() => {
            const updatedLines = this.lines.filter(line => line.id !== lineId);
            this.lines = updatedLines;
            this.linesUpdated.next([...this.lines]);
        });
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