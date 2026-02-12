import Timing from '@libs/Timing';
import React from 'react';
import { View } from 'react-native';


function EmptyPlaceholderScreen() {
    return (
        <View onLayout={() => Timing.end('SearchPage')}/>
    );
}

EmptyPlaceholderScreen.displayName = 'EmptyPlaceholderScreen';

export default EmptyPlaceholderScreen;
