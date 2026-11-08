# SaudiCord

**SaudiCord** is an Arabic-focused desktop client project built on top of [Vesktop](https://github.com/Vencord/Vesktop), with the goal of making the Discord desktop experience more natural for Arabic users.

> SaudiCord is an independent community project. It is not affiliated with, endorsed by, or sponsored by Discord Inc., Vencord, or the Vesktop contributors.

## Project goals

- Arabic interface with correct right-to-left (RTL) layout.
- Preserve the familiar Discord desktop experience instead of replacing it with an unrelated design.
- Focus on Windows 10 and Windows 11 first.
- Improve plugin discovery and management, with clear permission and source information before a plugin is enabled.
- Apply security-conscious defaults and verify update integrity.
- Keep Discord as the service for accounts, servers, messages, and voice. SaudiCord does not create a separate chat network or ask users to create SaudiCord accounts.

## Project status

SaudiCord is in early development. The current code includes Arabic first-launch, about, updater, and native settings surfaces; an Arabic browser locale is requested for Discord. Full Discord interface translation and complete RTL behavior are not yet verified. Plugin review/management and production-grade signed updates are still pending. Do not assume this is a production-ready build.

## Upstream foundation and acknowledgements

SaudiCord is based on **Vesktop**, developed by the Vencord contributors.

- Upstream project: https://github.com/Vencord/Vesktop
- Upstream organization: https://github.com/Vencord
- Vesktop website: https://vesktop.dev
- License: GNU General Public License v3.0 or later (GPL-3.0-or-later)

Upstream copyright notices remain in the source files. The derived Vesktop code is marked GPL-3.0-or-later. This development repository currently does not bundle a `LICENSE` file; do not distribute source archives or application binaries until the required license text and all applicable notices are included. See [CREDITS.md](./CREDITS.md). Third-party dependencies and assets may have their own licenses.

## Building from source

### Requirements

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/download)
- [pnpm](https://pnpm.io/)

Install pnpm if needed:

```sh
npm install --global pnpm
```

Clone this repository and install dependencies:

```sh
git clone https://github.com/xxm-cmyk/SaudiCord-.git
cd SaudiCord-
pnpm install
```

Run the development app:

```sh
pnpm start
```

Package for the current operating system:

```sh
pnpm package
```

Or package to a directory:

```sh
pnpm package:dir
```

Build output is placed in the `dist/` directory. Build requirements and available targets may vary by operating system; Windows is the initial SaudiCord target, and Windows packaging still needs to be validated as SaudiCord development progresses.

## Security

Read [docs/SECURITY.md](./docs/SECURITY.md) for the project's security principles. These are design requirements, not a claim that the current code has already implemented or passed every security control.

## Contributions

Before proposing a change, please identify whether it modifies upstream Vesktop behavior or adds SaudiCord-specific functionality. Preserve relevant copyright notices and license terms when modifying or redistributing upstream code.
