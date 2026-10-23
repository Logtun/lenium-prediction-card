# My Lenium Prediction card

A fan-made share card for [Lenium](https://www.lenium.capital/) ([@Lenium_Capital](https://x.com/Lenium_Capital)), the prediction market prop firm.

Enter your X handle (your name and photo load automatically), pick a market category, type your prediction or pick a starter, call YES or NO and set how sure you are. You get a card to download as a PNG, plus a ready-made caption and a Share on X button.

- Static site: plain HTML, CSS and JavaScript. No backend, no build step, no API keys.
- No live prices or market data. The confidence on the card is the person's own number, not a market price.
- Lenium accounts are simulated evaluation accounts.

made by [@iamlogtun](https://x.com/iamlogtun) · not official. This is a community project and is not endorsed by Lenium.

## Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import this repo (`lenium-prediction-card`).
3. Framework preset: **Other**. Leave the build command empty.
4. Click **Deploy**.

The caption's "Make yours →" link uses whatever address the site is opened on, so it picks up your Vercel URL by itself.

## After deploying: fix the link preview image

X and WhatsApp need an absolute URL for the preview image. Once you have your Vercel address (for example `https://lenium-prediction-card.vercel.app`), edit `index.html`:

- set `og:image` and `twitter:image` to `https://YOUR-SITE.vercel.app/og.jpg?v=1`
- add `<meta property="og:url" content="https://YOUR-SITE.vercel.app/">` after `og:type`

## Credits

Lenium name, logo and fonts (Bricolage Grotesque, Geist, Geist Mono) belong to their owners; the logo is taken from Lenium's own site and is used here only to point back to lenium.capital. X names and photos are loaded from public profiles.
