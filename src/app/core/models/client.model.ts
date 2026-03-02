export type FilingType = 'Monthly' | 'QRMP';

export interface Client {
    id: string;
    clientName: string;
    gstin: string;
    filingType: FilingType;
    isActive: boolean;
    lead?: string;
    defaultAssignedTo?: string;
    rank?: string;
    rcmApplicable?: boolean;
    contactNumber?: string;
    modeOfFiling?: string;
}
