# siruconsult.com

Static website for Siru Consulting LLC (English at `/`, Chinese at `/zh/`).
Inner pages: AI & Business Systems at `/ai-systems/` and Case studies at `/work/` (Chinese under `/zh/`); they use `assets/pages.css` and the hero animation in `assets/circuit.js`.
Hosted on GitHub Pages with the custom domain in `CNAME`.

- No build step, fonts self-hosted (SIL Open Font License: Sora, Plus Jakarta Sans).
- Content Security Policy is set in each page's `<meta http-equiv>`.
- Contact form posts to Web3Forms (`api.web3forms.com`); the only third-party script is hCaptcha on the form.
- Logo files: `assets/img/` (symbol, wordmark, lockup; `-reverse` = for dark backgrounds).
