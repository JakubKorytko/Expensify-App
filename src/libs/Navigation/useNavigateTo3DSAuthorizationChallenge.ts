import useOnyx from '@hooks/useOnyx';
import {fetchLatestTransactionsPendingReviewAndCheckIfThisOneIsInIt} from '@libs/actions/MultifactorAuthentication';
import ONYXKEYS from '@src/ONYXKEYS';
import CONST from '@src/CONST';
import type {TransactionPending3DSReview} from '@src/types/onyx';
import {useEffect, useMemo} from 'react';
import ROUTES from '@src/ROUTES';
import useNativeBiometrics from '@components/MultifactorAuthentication/Context/useNativeBiometrics';
import isLoadingOnyxValue from '@src/types/utils/isLoadingOnyxValue';
import useRootNavigationState from '@hooks/useRootNavigationState';
import {findFocusedRoute} from '@react-navigation/native';
import Navigation, {getIsUserViewingMFAFlowScreen, isMFAFlowScreen} from './Navigation';

function getOldestTransactionPendingReview(transactions: TransactionPending3DSReview[]) {
    return transactions
        .sort((a, b) => {
            // We really really want predictable, stable ordering for transaction challenges.
            // Prioritize created date, but if they're the same sort by expired date,
            // and if those are the same, sort by ID
            const createdDiff = new Date(a.created).getTime() - new Date(b.created).getTime();
            if (createdDiff !== 0) {
                return createdDiff;
            }

            const expiresDiff = new Date(a.expires).getTime() - new Date(b.expires).getTime();
            if (expiresDiff !== 0) {
                return createdDiff;
            }
            
            return Number(a.transactionID) - Number(b.transactionID)
        })
        .at(0);
}

function useNavigateTo3DSAuthorizationChallenge() {
    const [blocklistedTransactionChallenges, blocklistResult] = useOnyx(ONYXKEYS.BLOCKLISTED_3DS_TRANSACTION_CHALLENGES, {canBeMissing: true});
    const [transactionsPending3DSReview] = useOnyx(ONYXKEYS.TRANSACTIONS_PENDING_3DS_REVIEW, {canBeMissing: true});

    console.log('transactionsPending3DSReview', transactionsPending3DSReview);
    console.log('blocklistedTransactionChallenges', blocklistedTransactionChallenges);
    
    const isCurrentlyInMFAFlow = useRootNavigationState((state) => {
        if (!state) {
            return false;
        }
        const focusedScreen = findFocusedRoute(state)?.name;
        console.log('CHUCKCHUCK focusedScreen', focusedScreen);
        return isMFAFlowScreen(focusedScreen);
    });

    console.log('CHUCKCHUCK isCurrentlyInMFAFlow', isCurrentlyInMFAFlow);

    const {doesDeviceSupportBiometrics} = useNativeBiometrics();

    const transactionPending3DSReview = useMemo(() => {
        if (!transactionsPending3DSReview || isLoadingOnyxValue(blocklistResult)) {
            return undefined;
        }
        const nonBlocklistedTransactions = Object.values(transactionsPending3DSReview).filter((challenge) =>
            blocklistedTransactionChallenges && challenge.transactionID ? !blocklistedTransactionChallenges[challenge.transactionID] : true,
        );
        return getOldestTransactionPendingReview(nonBlocklistedTransactions);
    }, [transactionsPending3DSReview, blocklistedTransactionChallenges, blocklistResult]);

    useEffect(() => {
        console.log("Effect!")
        if (!transactionPending3DSReview?.transactionID) {
            return;
        }

        // note: importing AuthorizeTransaction in this file causes the browser to get stuck in an infinite reload loop
        const allowedAuthenticationMethods = [CONST.MULTIFACTOR_AUTHENTICATION.TYPE.BIOMETRICS];
        const doesDeviceSupportAnAllowedAuthenticationMethod = allowedAuthenticationMethods.some((method) => {
            switch (method) {
                case CONST.MULTIFACTOR_AUTHENTICATION.TYPE.BIOMETRICS:
                    return doesDeviceSupportBiometrics();
                // TODO expand when we support passkeys
                default:
                    return false;
            }
        });

        if (!doesDeviceSupportAnAllowedAuthenticationMethod) {
            return;
        }

        let cancel = false;

        async function maybeNavigateTo3DSChallenge() {
            console.log("ASYNC EFFECT");
            if (!transactionPending3DSReview?.transactionID) {
                return;
            }

            console.log("ASYNC 2")

            const challengeStillValid = await fetchLatestTransactionsPendingReviewAndCheckIfThisOneIsInIt({transactionID: transactionPending3DSReview.transactionID});
            if (!challengeStillValid || cancel) {
                return;
            }

            // CHUCK NOTE I swear I thought lazily checking this after the above api call returns was important, but I cannot for the life of me remember what case I was solving for
            const doubleCheckIsCurrentlyInMFAFlow = getIsUserViewingMFAFlowScreen();
            console.log('doubleCheckIsCurrentlyInMFAFlow', doubleCheckIsCurrentlyInMFAFlow);
            if (doubleCheckIsCurrentlyInMFAFlow) {
                return;
            }
            Navigation.navigate(ROUTES.MULTIFACTOR_AUTHENTICATION_AUTHORIZE_TRANSACTION.getRoute(transactionPending3DSReview.transactionID));
        }

        maybeNavigateTo3DSChallenge();
        return () => {
            cancel = true;
        };
    }, [transactionPending3DSReview?.transactionID, doesDeviceSupportBiometrics, isCurrentlyInMFAFlow]);
}

export default useNavigateTo3DSAuthorizationChallenge;
