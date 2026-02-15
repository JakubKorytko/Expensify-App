import React, {useCallback, useEffect} from 'react';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';
import {View} from 'react-native';
import type {OnyxEntry} from 'react-native-onyx';
import Avatar from '@components/Avatar';
import {usePersonalDetails} from '@components/OnyxListItemProvider';
import Text from '@components/Text';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useThemeStyles from '@hooks/useThemeStyles';
import useOnyx from '@hooks/useOnyx';
import {openPublicProfilePage} from '@libs/actions/PersonalDetails';
import {isCorrectSearchUserName} from '@libs/SearchUIUtils';
import type {AvatarSource} from '@libs/UserAvatarUtils';
import type {AvatarSizeName} from '@styles/utils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {PersonalDetailsList} from '@src/types/onyx';

type UserInfoCellProps = {
    accountID: number | undefined;
    avatar: AvatarSource | undefined;
    displayName: string;
    avatarSize?: AvatarSizeName;
    containerStyle?: StyleProp<ViewStyle>;
    textStyle?: TextStyle;
    avatarStyle?: ViewStyle;
};

const requestedProfileAccountIDs = new Set<number>();

function UserInfoCell({avatar, accountID, displayName, avatarSize, containerStyle, textStyle, avatarStyle}: UserInfoCellProps) {
    const styles = useThemeStyles();
    const {isLargeScreenWidth} = useResponsiveLayout();
    const allPersonalDetails = usePersonalDetails();
    const personalDetailSelector = useCallback(
        (personalDetailsList: OnyxEntry<PersonalDetailsList>) => (accountID ? personalDetailsList?.[accountID] : undefined),
        [accountID],
    );
    const personalDetailsMetadataSelector = useCallback(
        (metadata: OnyxEntry<Record<string, {isLoading?: boolean}>>) => (accountID ? metadata?.[accountID] : undefined),
        [accountID],
    );
    const [personalDetailsFromSnapshot] = useOnyx(ONYXKEYS.PERSONAL_DETAILS_LIST, {selector: personalDetailSelector, canBeMissing: true}, [accountID]);
    const [personalDetailsMetadata] = useOnyx(ONYXKEYS.PERSONAL_DETAILS_METADATA, {selector: personalDetailsMetadataSelector, canBeMissing: true}, [accountID]);
    const personalDetails = personalDetailsFromSnapshot ?? (accountID ? allPersonalDetails?.[accountID] : undefined);
    const avatarSource = avatar || personalDetails?.avatar;
    const hasRequestedProfile = !!(accountID && requestedProfileAccountIDs.has(accountID));

    useEffect(() => {
        if (!accountID || !!avatarSource || personalDetailsMetadata?.isLoading || hasRequestedProfile) {
            return;
        }

        requestedProfileAccountIDs.add(accountID);
        openPublicProfilePage(accountID);
    }, [accountID, avatarSource, personalDetailsMetadata?.isLoading, hasRequestedProfile]);

    if (!isCorrectSearchUserName(displayName) || !accountID) {
        return null;
    }

    return (
        <View style={[styles.flexRow, styles.alignItemsCenter, containerStyle]}>
            <Avatar
                imageStyles={[styles.alignSelfCenter]}
                size={avatarSize ?? CONST.AVATAR_SIZE.MID_SUBSCRIPT}
                source={avatarSource}
                name={displayName}
                type={CONST.ICON_TYPE_AVATAR}
                avatarID={accountID}
                containerStyles={[styles.pr2, avatarStyle]}
            />
            <Text
                numberOfLines={1}
                style={[isLargeScreenWidth ? styles.themeTextColor : styles.textMicroSupporting, styles.flexShrink1, textStyle]}
            >
                {displayName}
            </Text>
        </View>
    );
}

export default UserInfoCell;
