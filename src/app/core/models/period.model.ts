export interface Period {
    id: string;
    month: string;
    financial_year: string;
    status: 'open' | 'filed';
    created_at?: string;
}
