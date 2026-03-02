export type ReturnType = 'GSTR-1' | 'GSTR-3B' | 'CMP-08' | 'ITC-04';
export type ReturnStatus = 'Pending' | 'Filed' | 'Overdue';

export interface Return {
    id: string;
    clientId: string;
    clientName: string;
    /**
     * The period of the return in YYYY-MM format.
     */
    period: string;
    type: ReturnType;
    status: ReturnStatus;
    dueDate: string;
    assignedTo?: string;
    taxPayable?: number;
    filedDate?: string;
    remarks?: string;
}
