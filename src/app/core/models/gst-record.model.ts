export interface GstRecord {
    id: string;
    client_id: string;
    period_id: string;
    gstr1_status: 'pending' | 'filed';
    gstr3b_status: 'pending' | 'filed';
    gstr1_filed_date?: string;
    gstr3b_filed_date?: string;
    remarks?: string;
    client_name?: string;
    month?: string;
    financial_year?: string;
    assigned_to?: string;
    assigned_to_name?: string;

    // Excel mapped fields
    gstr1_tally_received?: string;
    gstr1_entered_in_tally?: boolean;
    gstr1_nil_return?: boolean;
    gstr1_comments?: string;

    gstr3b_tally_received?: string;
    gstr3b_entered_in_tally?: boolean;
    gstr3b_reconciliation?: string;
    gstr3b_notices_orders?: boolean;
    gstr3b_bills_pending?: boolean;
    gstr3b_tax_liability?: string;
    gstr3b_nil_return?: boolean;
    gstr3b_comments?: string;

    gstr1a_applicable?: boolean;
    billing_status?: string;
    bill_sent?: boolean;
}
