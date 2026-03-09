export interface Project {
    id: string;
    name: string;
    clientId?: string;
    status: 'draft' | 'sent' | 'approved' | 'paid';
    createdAt?: string;
}
