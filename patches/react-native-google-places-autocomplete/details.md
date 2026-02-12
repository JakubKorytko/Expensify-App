# `react-native-google-places-autocomplete` patches

### [react-native-google-places-autocomplete+2.6.4+001+fix-tdz-crash.patch](react-native-google-places-autocomplete+2.6.4+001+fix-tdz-crash.patch)

- Reason:

    ```
    Fixes a Temporal Dead Zone (TDZ) crash: `useRef(_request)` on line 161 references
    `_request` before its `const` declaration on line 466, causing
    `ReferenceError: Cannot access '_request' before initialization`.
    Replacing the initial value with `null` is safe because `requestRef.current`
    is reassigned to `_request` on every render (line 1079) before it can be invoked.
    ```

- Upstream PR/issue: 🛑, library is unmaintained (https://github.com/FaridSafi/react-native-google-places-autocomplete/issues/978)
- E/App issue: https://github.com/Expensify/App/pull/82233
- PR introducing patch: https://github.com/Expensify/App/pull/82233
