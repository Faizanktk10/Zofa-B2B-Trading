# TODO

## Verification code visibility (urgent)
- [x] Disable email sending temporarily in `AuthController` so verification works even if Gmail fails.
- [x] Ensure verification code is still generated and saved to DB and printed to server console.
- [x] Update frontend `VerifyEmail.jsx` to show a big bold SERVER CODE area.
- [ ] Add a debug endpoint to fetch latest unused verification code for a given email (dev/support only).
- [ ] Update `VerifyEmail.jsx` to call this debug endpoint and set `serverCode` so code displays to the user.
- [ ] Copy-paste friendly UX polish (auto-select, disable resend while fetching).
- [ ] Build check + final commit/PR.

