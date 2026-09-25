# Takewise ERP Web

Frontend foundation for a multi-tenant ERP. It provides authentication, tenant-aware routing, permission-aware navigation, an API client, and MSW-backed demo data without implementing real accounts or business workflows.

## Submission

**Public GitHub repository:** Replace the placeholder with the final public repository URL before submission:

`https://github.com/your-github-username/takewise-erp-web`

### Choices and Scope

- **Vue 3, Vite, and TypeScript** provide a lightweight, typed frontend foundation that another developer can install and extend quickly.
- **Vue Router** handles public and tenant-scoped routes. Tenant switching uses SPA navigation rather than a full-page reload.
- **Pinia** stores the authenticated user, memberships, and active tenant. **Axios** centralizes API calls, credentials, tenant headers, session refresh, and common error handling.
- Loading and request errors are handled in the individual Vue views for this small demo, keeping each screen's state explicit. As the application grows, these concerns can be moved into shared request/interceptor infrastructure and reusable UI components.
- **PrimeVue, Tailwind CSS, and PrimeIcons** provide the initial UI building blocks without creating a bespoke component system before the ERP workflows are known.
- **Zod** provides basic login validation at the feature boundary. A shared, common validation layer for all future modules was intentionally left out for this demo; it can be introduced when the backend contracts and ERP workflows are finalized.
- **Mock Service Worker (MSW)** supplies realistic local demo data and simulates server-side authentication, membership checks, permissions, and tenant isolation. The tenant slug in the URL and the `X-Tenant-ID` header are used to identify the active company because the demo has no real backend tenant context. In production, tenant identity and tenant routing can be maintained and enforced by the backend APIs and authenticated session.
- **ESLint, Oxlint, Prettier, TypeScript, and Vue TSC** provide the baseline code-quality and validation tooling.
- **Cluade code** was used as an AI coding assistant for repository setup, implementation, documentation, and validation. All generated code was reviewed against the application requirements and should be explainable by the candidate.

The following were intentionally left out because this is a frontend foundation rather than a production ERP:

- No real backend, database, user accounts, HTTP-only production session, or OAuth provider.
- No real password reset flow. The routes and mock endpoints establish the API contract only.
- No create, edit, delete, billing, inventory, reporting, or other full ERP workflows.
- No production deployment configuration or CI pipeline, since the submission target and hosting provider were not specified.

The mock credentials and local run instructions are documented below. The implementation is intentionally structured so the mock handlers can later be replaced by the real server APIs without changing the feature screens.

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
| `admin@acme.test` | `Demo@123` | Acme Manufacturing; customer read/write |

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
