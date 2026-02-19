import useOnyx from '@hooks/useOnyx';
import {isTransactionStillPending3DSReview} from '@libs/actions/MultifactorAuthentication';
import ONYXKEYS from '@src/ONYXKEYS';
import CONST from '@src/CONST';
import type {TransactionPending3DSReview} from '@src/types/onyx';
import {useEffect, useMemo} from 'react';
import ROUTES from '@src/ROUTES';
import useNativeBiometrics from '@components/MultifactorAuthentication/Context/useNativeBiometrics';
import isLoadingOnyxValue from '@src/types/utils/isLoadingOnyxValue';
import Navigation from './Navigation';

// We want predictable, stable ordering for transaction challenges to ensurewe don't
// accidentally navigate the user while they're in the middle of acting on a challenge.
// Prioritize created date, but if they're the same sort by expired date,
// and if those are the same, sort by ID
function sortTransactionsPending3DSReview(transactions: TransactionPending3DSReview[]) {
    return transactions
        .sort((a, b) => {
            const createdDiff = new Date(a.created).getTime() - new Date(b.created).getTime();
            if (createdDiff !== 0) {
                return createdDiff;
            }

            const expiresDiff = new Date(a.expires).getTime() - new Date(b.expires).getTime();
            if (expiresDiff !== 0) {
                return expiresDiff;
            }

            return Number(a.transactionID) - Number(b.transactionID);
        })
        .at(0);
}

function useNavigateTo3DSAuthorizationChallenge() {
    const [locallyProcessed3DSTransactionReviews, locallyProcessedReviewsResult] = useOnyx(ONYXKEYS.LOCALLY_PROCESSED_3DS_TRANSACTION_REVIEWS, {canBeMissing: true});
    const [transactionsPending3DSReview] = useOnyx(ONYXKEYS.TRANSACTIONS_PENDING_3DS_REVIEW, {canBeMissing: true});

    const {doesDeviceSupportBiometrics} = useNativeBiometrics();

    const transactionPending3DSReview = useMemo(() => {
        if (!transactionsPending3DSReview || isLoadingOnyxValue(locallyProcessedReviewsResult)) {
            return undefined;
        }
        const nonBlocklistedTransactions = Object.values(transactionsPending3DSReview).filter((challenge) =>
            locallyProcessed3DSTransactionReviews && challenge.transactionID ? !locallyProcessed3DSTransactionReviews[challenge.transactionID] : true,
        );
        return sortTransactionsPending3DSReview(nonBlocklistedTransactions);
    }, [transactionsPending3DSReview, locallyProcessed3DSTransactionReviews, locallyProcessedReviewsResult]);

    useEffect(() => {
        if (!transactionPending3DSReview?.transactionID) {
            return;
        }

        // Note: Importing AuthorizeTransaction in this file causes the browser to get stuck in an infinite reload loop
        // Issue to fix this: https://github.com/Expensify/App/issues/83021
        const allowedAuthenticationMethods = [CONST.MULTIFACTOR_AUTHENTICATION.TYPE.BIOMETRICS];
        const doesDeviceSupportAnAllowedAuthenticationMethod = allowedAuthenticationMethods.some((method) => {
            switch (method) {
                case CONST.MULTIFACTOR_AUTHENTICATION.TYPE.BIOMETRICS:
                    return doesDeviceSupportBiometrics();
                default:
                    return false;
            }
        });

        // Do not navigate the user to the 3DS challenge if we can tell that they won't be able to complete it on this device
        if (!doesDeviceSupportAnAllowedAuthenticationMethod) {
            return;
        }

        let cancel = false;

        async function maybeNavigateTo3DSChallenge() {
            // It's actually not possible to reach this return. We're using an arrow function for the body of the effect, which captures the value
            // of transactionPending3DSReview. If the transactionID was undefined when we started the effect, we would've returned above, and if
            // it became undefined between then and now, Onyx will return a whole new object reference, so this effect will still be holding onto
            // the old value and react will run a second effect with the new value. Typescript doesn't know that Onyx treats the object as
            // immutable, so we must guard against transactionID becoming undefined again, even though we know it won't be.
            if (!transactionPending3DSReview?.transactionID) {
                return;
            }

            // Make an API call to double check that the challenge is still valid
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            const challengeStillValid = transactionPending3DSReview?.simulated || (await isTransactionStillPending3DSReview(transactionPending3DSReview.transactionID));

            // If we know that a challenge isn't valid anymore, better to bail out of navigating to the flow rather than showing the user the "already reviewed" outcome screen
            if (!challengeStillValid || cancel) {
                return;
            }

            // If the challenge is still valid, navigate the user to the AuthorizePage
            Navigation.navigate(ROUTES.MULTIFACTOR_AUTHENTICATION_AUTHORIZE_TRANSACTION.getRoute(transactionPending3DSReview.transactionID));
        }

        maybeNavigateTo3DSChallenge();

        return () => {
            cancel = true;
        };
    }, [transactionPending3DSReview?.transactionID, doesDeviceSupportBiometrics, transactionPending3DSReview?.simulated]);
}

export default useNavigateTo3DSAuthorizationChallenge;
export {sortTransactionsPending3DSReview};
