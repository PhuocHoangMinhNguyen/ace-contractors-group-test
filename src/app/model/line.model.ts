// Model of a line object with its attributes

export interface Line {
    id: string;
    item: string;
    rate: number;
    quantity: number;
    amount: number;
    taxable?: boolean;
    taxRate?: number;
    category?: 'Labour' | 'Materials' | 'Equipment' | 'Subcontractor' | 'Overhead' | 'Other';
    projectId?: string;
}
