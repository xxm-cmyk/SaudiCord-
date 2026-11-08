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
