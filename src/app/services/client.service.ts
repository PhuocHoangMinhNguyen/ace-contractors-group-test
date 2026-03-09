import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Client } from '../model/client.model';

const BASE_URL = environment.apiUrl + '/clients/';

@Injectable({ providedIn: 'root' })
export class ClientService {
    private clients: Client[] = [];
    private clientsUpdated = new BehaviorSubject<Client[]>([]);

    constructor(private http: HttpClient) {}

    getClients(): void {
        this.http.get<{ message: string; clients: any[] }>(BASE_URL)
            .pipe(map(res => res.clients.map(c => ({ id: c._id, name: c.name, email: c.email, phone: c.phone, address: c.address }))))
            .subscribe({
                next: clients => {
                    this.clients = clients;
                    this.clientsUpdated.next([...this.clients]);
                },
                error: err => console.error('Failed to fetch clients:', err)
            });
    }

    getClientsListener(): Observable<Client[]> {
        return this.clientsUpdated.asObservable();
    }

    createClient(client: Omit<Client, 'id'>): Observable<Client> {
        return this.http.post<{ message: string; clientId: string }>(BASE_URL, client).pipe(
            map(res => {
                const newClient: Client = { id: res.clientId, ...client };
                this.clients = [...this.clients, newClient];
                this.clientsUpdated.next([...this.clients]);
                return newClient;
            })
        );
    }
}
