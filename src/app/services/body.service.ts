import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';

@Injectable()
export class BodyService {
    constructor(private http: HttpClient) { }
}