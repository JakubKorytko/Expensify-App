type TravelInvoiceStatement = {
    /** Whether a statement is currently being generated */
    isGenerating: boolean;

    /** Map of statement key (policyID_startDate_endDate) to filename */
    [key: string]: string | boolean;
};

export default TravelInvoiceStatement;
