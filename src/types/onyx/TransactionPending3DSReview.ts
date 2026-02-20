/**
 * Minimal transaction data needed to render the MFA authorize transaction preview.
 * This is stored under the `transactionsPending3DSReview` Onyx key.
 */
type TransactionPending3DSReview = {
    /** Transaction amount in cents */
    amount: number;

    /** Transaction currency */
    currency: string;

    /** Merchant name */
    merchant: string;

    // CHUCK QUESTION: is the comment below true? Seems like it's YYYY-MM-DD in Auth
    /** Created date (YYYY-MM-DD or full timestamp, depending on source) */
    created: string;

    /** Expiration date - should be exactly 8 minutes after created date */
    expires: string;

    /** Last 4 digits of the card PAN */
    lastFourPAN: number;

    /** Optional reportID if the backend provides it */
    reportID?: string;

    /** Optional transactionID if the backend provides it */
    transactionID?: string;

    /** Added by client to mark that an approval/denial request is in-flight for this transaction */
    isLoading?: boolean;

    /** Added by the troubleshooting tool to mark that this transaction is simulated */
    simulated?: boolean;
};

export default TransactionPending3DSReview;
