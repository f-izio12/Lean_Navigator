# Security

## Reporting a vulnerability

Please do not open a public issue for security problems. Use GitHub's private vulnerability reporting (the **Security** tab of this repository, then **Report a vulnerability**). Describe the problem, the steps to reproduce it and the version you tested.

## Security model in short

- There is no server. Projects, settings and any AI key are encrypted in the browser (AES-GCM 256, key wrapped with PBKDF2-SHA256, 600,000 iterations).
- While the app is unlocked, the data key and the AI key are in the page's memory. Anything that could run script in the page could read them, so the app treats all external content as untrusted:
  - Hoshin share files are validated on import: only known fields are kept, identifiers must match `[A-Za-z0-9_-]`, text is length-capped.
  - Restored and synced vaults are checked the same way when they are opened.
  - All text is escaped before it is rendered.
  - A Content-Security-Policy blocks inline scripts, inline event handlers, plugins and frames.
- Libraries are stored in the repository, not loaded from external services.

## Known limits

- The Content-Security-Policy is set in the page itself, because GitHub Pages cannot send security headers. Protection against embedding the app in another site (`frame-ancestors`) is therefore not available.
- Outgoing connections are allowed to any `https` address and to `localhost`, because the app lets you connect to any AI provider or a local model.
- Share files are not encrypted. Do not put confidential information in a plan you share.
