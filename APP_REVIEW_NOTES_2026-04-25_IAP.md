# ClawPool App Review Notes (2026-04-25)

## Reply to App Review

Hello App Review,

Thank you for the feedback. We investigated the issue where the subscription button could remain loading and the purchase flow did not begin.

We have fixed the iOS in-app purchase flow in the latest build.

### What we changed

1. Improved iOS purchase listener handling
   - The app now registers a stable purchase listener once and correctly tracks the active purchase.
   - This prevents the subscribe button from remaining in a loading state if Apple's purchase callback is delayed or returned asynchronously.

2. Added purchase timeout and recovery handling
   - If Apple does not return a purchase result in time, the app now exits loading state and shows an error instead of spinning indefinitely.

3. Added product availability checks before purchase
   - The app now confirms that the requested subscription product is available from Apple before starting the purchase flow.
   - If the review sandbox account cannot access the product, the app now fails gracefully instead of appearing stuck.

### In-App Purchase products used by the app

- `org.hihired.clawpool.basic`
- `org.hihired.clawpool.pro`

### Notes for testing

- The app uses Apple In-App Purchase for iOS subscriptions.
- The products above are the active subscription product IDs used by the build.
- Our server supports Apple's production receipt verification and automatically retries against the sandbox endpoint for App Review / sandbox receipts.

### How to verify

1. Launch the app
2. Create an account or sign in
3. Open the Plans / subscription screen
4. Tap Subscribe on either paid plan
5. The Apple purchase sheet should appear normally
6. After confirming the purchase, the app should complete receipt verification and unlock the selected plan

If the sandbox review account is unable to access the product listing, the app now shows an explicit unavailability message instead of remaining on a loading spinner.

Thank you for reviewing the updated build.

## App Review Information

This app offers auto-renewable subscriptions through Apple In-App Purchase on iOS.

Product IDs:
- `org.hihired.clawpool.basic`
- `org.hihired.clawpool.pro`

The app verifies receipts server-side and supports both production and sandbox receipt validation.

If needed, reviewers can create any new account inside the app to test the subscription flow.
