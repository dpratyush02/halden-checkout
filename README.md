# Halden Supply Checkout

A responsive, single-page e-commerce checkout built with plain HTML, CSS, and vanilla JavaScript. It runs entirely in the browser with no backend, no build step, and no dependencies.

This is a demo. No payment details are requested, and placing an order only shows a sample confirmation on the page. Nothing is sent to a server.

## Files

```
halden-checkout/
├── index.html   Page markup (checkout form, order summary, confirmation view)
├── styles.css   All styling, including the responsive layout
├── script.js    Pricing, quantity updates, form validation, mock order flow
└── README.md
```

## Run locally

**Option 1: open the file.** Double-click `index.html`, or drag it into any modern browser. Everything works from `file://`.

**Option 2: serve the folder** (closer to how it behaves when hosted). From inside the `halden-checkout` folder, run one of:

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve .
```

Then open http://localhost:8080 (or the address `npx serve` prints).

## Deploy to static hosting

The folder is ready to upload as-is; there is nothing to build.

- **Netlify:** drag the `halden-checkout` folder onto https://app.netlify.com/drop.
- **GitHub Pages:** push the files to a repository, then enable Pages under Settings > Pages and choose the branch and root folder.
- **Vercel / Cloudflare Pages:** import the repository and leave the build command empty, with the output directory set to the project root.

## How it works

- **Order summary.** Changing the quantity (buttons or typing, 1 to 10) recalculates the line total, subtotal, shipping, total, and the amount shown on the Place order button. Shipping is a flat $9.50 and becomes free once the subtotal reaches $250.
- **Validation.** The form uses `novalidate`, so validation is handled in `script.js`. Errors appear inline under each field when the form is submitted, and fields re-check themselves as you correct them. A summary message at the top reports how many fields need fixing, and focus moves to the first one.
- **Confirmation.** After a valid submission the button shows a short processing state, then the page switches to a confirmation view with a generated order number, totals, shipping address, contact details, and an estimated delivery window. "Start a new order" resets everything.

## Customizing

Product and pricing settings live at the top of `script.js`:

```js
const PRODUCT = { sku, name, variant, unitPrice };
const SHIPPING_FLAT_RATE = 9.5;
const FREE_SHIPPING_THRESHOLD = 250;
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 10;
```

The product name and variant text also appear in `index.html` (order summary and confirmation), so update both places if you change them. Colors and fonts are defined as CSS custom properties at the top of `styles.css`.

## Browser support

Current versions of Chrome, Edge, Firefox, and Safari, on desktop and mobile. Fonts load from Google Fonts; if they are unavailable, the page falls back to system fonts.
