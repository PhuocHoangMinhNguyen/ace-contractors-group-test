import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { Line } from './../model/line.model';

const BACKEND_URL = "http://localhost:3000/api/lines";

@Injectable({ providedIn: 'root' })
export class BodyService {
    private lines: Line[] = [];
    private linesUpdated = new Subject<Line[]>();

    constructor(private http: HttpClient) { }

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
                    }
                })
            })).subscribe(transformedLines => {
                this.lines = transformedLines;
                this.linesUpdated.next([...this.lines]);
            });
    }

    getLineUpdateListener() {
        return this.linesUpdated.asObservable();
    }

    addLine(item: string, rate: number, quantity: number) {
        const line: Line = { id: null, item: item, rate: rate, quantity: quantity, amount: rate * quantity };
        this.http.post<{ message: string, lineId: string }>(BACKEND_URL, line)
            .subscribe(responseData => {
                const id = responseData.lineId;
                line.id = id;
                this.lines.push(line);
                this.linesUpdated.next([...this.lines]);
            });
    }

    deleteLine(lineId: string) {
        this.http.delete(BACKEND_URL + "/" + lineId)
            .subscribe(() => {
                const updatedLines = this.lines.filter(line => line.id !== lineId);
                this.lines = updatedLines;
                this.linesUpdated.next([...this.lines])
            });
    }

    printDocument() {
        console.log("Print");
    }
}