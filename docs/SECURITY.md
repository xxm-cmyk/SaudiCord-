# Security policy and design requirements

This document describes SaudiCord's intended security requirements. It is not a security audit and does not claim that every control is already implemented.

## Account authentication and session data

- Do not create a SaudiCord password form for Discord credentials.
- Use an officially supported Discord sign-in flow where applicable; do not collect a user's Discord password.
- Treat session data and authentication tokens as secrets.
- Never display, log, commit, or transmit authentication tokens to SaudiCord-operated services.
- Request only the permissions necessary for a feature and explain why they are needed.

## Plugins

- Treat every third-party plugin as untrusted code until reviewed.
- Do not silently enable newly installed plugins.
- Before enabling a plugin, show its source, version, requested permissions, and available scan/review results.
- A clean antivirus or automated scan is not proof that a plugin is safe.
- Prefer isolation and least-privilege execution where technically feasible.
- Provide clear controls to disable and remove plugins.

## Updates and distribution

- Verify update authenticity and integrity before installation.
- Prefer signed releases and a trusted verification process.
- Fail safely if signature or integrity verification fails.
- Do not execute arbitrary update content from an untrusted source.

## Electron application security

- Keep context isolation enabled.
- Keep Node.js integration disabled for renderer content unless a narrowly scoped, reviewed exception is required.
- Validate IPC messages and restrict exposed preload APIs.
- Restrict navigation, permissions, external protocol handling, and window creation.
- Avoid loading unreviewed remote code into privileged application contexts.

## Reporting a vulnerability

Please do not publish exploitable details in a public issue. Contact the project maintainers privately through the repository's available contact method and include the affected version, impact, and reproducible details where safe to do so.


## Current implementation status

The following controls are present in the current code. Their presence is not a substitute for independent security testing:

- Main, updater, splash, first-launch, about, and Discord popout windows explicitly disable Node integration and enable context isolation and Chromium sandboxing.
- IPC sender validation rejects non-top-level frames and unapproved origins. Updater actions are additionally bound to the updater window's exact `WebContents`.
- Renderer-to-main command replies are accepted only from the main window's main frame.
- Vencord desktop assets are downloaded from the official Vencord GitHub release. The loader requires the four expected files, checks each GitHub-provided SHA-256 digest, and replaces the active files only after all downloads pass verification.
- Release publishing is configured for this repository and the initial release workflow targets Windows.

## Remaining release blockers

- **No `LICENSE` file is currently bundled by project choice.** The upstream-derived source is marked GPL-3.0-or-later. Do not distribute source archives or binaries until the complete required license text and notices are included.
- Windows code signing is not configured. HTTPS transport and update-file hashes do not provide the same publisher identity assurance as a trusted code-signing certificate.
- Electron cookie encryption remains disabled in the current fuse configuration pending cross-platform compatibility testing. Treat the local application profile as sensitive and protect it with the operating system account.
- The SaudiCord plugin review, scanning, permission display, and isolation system has not been implemented. Do not treat third-party Vencord plugins as sandboxed or safe.
- The Arabic browser locale is a preference signal only. Discord account language settings may override it, and full RTL behavior in Discord has not yet been verified.
