# Takewise ERP Web

Frontend foundation for a multi-tenant ERP. It provides authentication, tenant-aware routing, permission-aware navigation, an API client, and MSW-backed demo data without implementing real accounts or business workflows.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

Copy `.env.example` to `.env.development` when setting up a new checkout. Mock mode is enabled by default for local development.

### Compile and Hot-Reload for Development

```sh
npm run dev
```

Open the URL printed by Vite, then use one of these mock accounts:

| Email | Password | Access |
| --- | --- | --- |
| `admin@demo.test` | `Demo@123` | Acme Manufacturing and Globex Trading; customer read/write and settings permission in Acme |
| `viewer@demo.test` | `Demo@123` | Acme Manufacturing; customer read-only |

Switching companies changes the SPA route and sends the selected tenant ID in `X-Tenant-ID`. The mock server verifies both the signed-in user's membership and that header before returning customer records, so each company sees only its own sample data.

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Other checks

```sh
npm run type-check
npm run build
```

## Project Structure

- `src/core`: API client, authentication, tenant state, and permissions
- `src/app`: router and application plugin setup
- `src/layouts`: authenticated and public layouts
- `src/modules`: feature screens such as login, dashboard, and customers
- `src/mocks`: MSW handlers and tenant-scoped demo data
