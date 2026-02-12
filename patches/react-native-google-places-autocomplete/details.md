# `react-native-google-places-autocomplete` patches

### [react-native-google-places-autocomplete+2.6.4+001+fix-tdz-crash.patch](react-native-google-places-autocomplete+2.6.4+001+fix-tdz-crash.patch)

- Reason:

    ```
    Fixes two Temporal Dead Zone (TDZ) crashes in v2.6.4:

    1. `useRef(_request)` on line 161 references `_request` before its `const`
       declaration on line 466, causing
       `ReferenceError: Cannot access '_request' before initialization`.
       Fix: replace the initial value with `null` (safe because
       `requestRef.current` is reassigned to `_request` every render before
       it can be invoked).

    2. `_disableRowLoaders` (a `const useCallback`) was declared on line 653
       but referenced in the `useCallback` dependency arrays of
       `_requestNearby` (line 450) and `getCurrentLocation` (line 629),
       causing `ReferenceError: Cannot access '_disableRowLoaders' before
       initialization`. Fix: move `_disableRowLoaders` above
       `_requestNearby` so it is defined before first use.
    ```

- Upstream PR/issue: 🛑, library is unmaintained (https://github.com/FaridSafi/react-native-google-places-autocomplete/issues/978)
- E/App issue: https://github.com/Expensify/App/pull/82233
- PR introducing patch: https://github.com/Expensify/App/pull/82233
