# Quizzical Club 1.0.1 — store submission notes

Prepared October 19, 2026. Submit only after 1.0 is approved.

## What's new (store "What's New" text)

- Full Club: every board and level, one purchase; offer and promo codes.
- The quizmaster voice reads clues and answers.
- Say it: answer out loud, recognised on your device.
- Trivia Night: answers on the clue card, steals, "wrong answers cost points"
  and a lightning round.
- Seasonal Specials: Autumn Wordplay and Winter Wordplay.
- Preview: teams can buzz in and answer on their own phones — scan a QR code,
  no account needed.

## App Review notes (App Store Connect → App Review Information → Notes)

> Quizzical Club 1.0.1 adds an optional preview mode, "Teams answer on their
> own phones" (Trivia Night → choose a game → switch on the setup screen).
> The host phone shows a QR code; other phones join by scanning it (they open
> the app, or the website if it isn't installed). No account or sign-in is
> involved.
>
> While a game is running, the phones exchange short game messages (team
> names, buzzes, typed answers, scores, the current clue) through a small
> relay we run on Cloudflare Workers. Every message is end-to-end encrypted
> with a key that exists only in the QR code/link, so the relay cannot read
> it; it keeps nothing (games live only in memory and disappear within two
> hours; nothing is logged). Spoken answers are converted to text on the
> device; no audio is sent. Because no data is retained or accessible beyond
> serving the live game, our App Privacy answer remains "Data Not Collected".
>
> To try it with one device: start a game with the switch on, then open the
> join link shown under the QR code in Safari on a Mac or another device.
> One-phone play works fully offline as before. The microphone is used only
> when the player taps "Say it".

## Google Play Data safety (form answers to review)

- Data collection: **No data collected.** Messages in "play on several
  phones" are end-to-end encrypted (no intermediary, including us, can read
  them) and processed only ephemerally — Google excludes end-to-end encrypted
  data from the disclosure. Keep "Data is encrypted in transit: Yes".
- Data sharing: none.
- Audio: not collected (processed on device only).
- Families policy: no ads, no third-party SDKs, no accounts, no chat or
  user-to-user free text other than team names and quiz answers inside a
  private, ephemeral game the players set up themselves.

## Before submitting

- [ ] 1.0 approved on both stores.
- [ ] Test builds checked on devices: Say it (Workbook, clue card, team
      phone), several-phones game with two phones, QR opens the app.
- [ ] Privacy policy live with the "Playing on several phones" section.
- [ ] Play Data safety form reviewed as above.
