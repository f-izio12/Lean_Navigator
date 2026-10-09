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
- The app refuses to run inside another page (protection against clickjacking), and the page sends no referrer.
- The service worker caches only the app's own files listed in `sw.js`, and only successful responses. It never touches requests to other sites, including AI providers.
- The AI key is sent only over `https`, or over `http` to a model on the same computer (`localhost`, `127.0.0.1`). For an address that is not one of the listed providers, the app shows the exact destination and asks for confirmation before the key is sent for the first time.
- The encrypted data carries a revision number that goes up at every save. When the browser copy and the synced file differ, the higher revision wins, so an older copy put back in place cannot silently replace newer work. A synced file that does not open with your password is left untouched.
- The Jira CSV export neutralises cells that start with `=`, `+`, `-`, `@`, a tab or a carriage return, so spreadsheet programs do not run them as formulas.
- Interface translations are static files in `i18n/`, served from the app's own address under the same Content-Security-Policy. Translated text is escaped like all other text, and every translation is checked automatically for unexpected HTML before release. The language choice is stored unencrypted in the browser, because it is needed before the vault is unlocked; it is checked against the fixed list of languages.
- Libraries are stored in the repository, not loaded from external services.

## Dependencies

The libraries in `vendor/` are checked against the npm advisory database before each release. Each file is an unmodified copy of the `dist` file in the official npm package. You can check this yourself: download the package (`npm pack jspdf@4.2.1`), unpack it and compare the SHA-256 hash.

| File | Package | SHA-256 |
|---|---|---|
| `vendor/jspdf.umd.min.js` | jspdf 4.2.1 | `e6551fcdc32f09d6853b2c5126d18d01d9447e0da618a41a11ebeee0f6c20d54` |
| `vendor/jspdf.plugin.autotable.min.js` | jspdf-autotable 5.0.8 | `a65dff2c6a8296b16aff24e69f7683cd7dbaed4a4ec26b507d6840ee27d54649` |
| `vendor/exceljs.min.js` | exceljs 4.4.0 | `7e49da68588e250dbb8bba190d2caa8ab3787cc0284bda1d8b2f805c4df742c9` |

On Windows: `certutil -hashfile vendor\jspdf.umd.min.js SHA256`. On macOS or Linux: `shasum -a 256 vendor/*.js`.

- jsPDF 4.2.1 and jsPDF-AutoTable 5.0.8: no known advisories at release time.
- ExcelJS 4.4.0: one moderate advisory in the bundled `uuid` package (missing bounds check when a caller supplies its own buffer to the v3, v5 or v6 functions). The app never calls these functions this way, so the issue cannot be reached. No ExcelJS release without it exists yet.

## Known limits

- The Content-Security-Policy is set in the page itself, because GitHub Pages cannot send security headers. `frame-ancestors` therefore cannot be used; the app checks for framing in its own code instead and stops if it is framed.
- The Content-Security-Policy allows outgoing connections to any `https` address and to `localhost`, because the app lets you connect to any AI provider or a local model. The AI settings add the stricter rules described above.
- The revision check protects against an older copy replacing a newer one. If you deliberately restore an older backup, that backup becomes the current version, also in the synced file.
- The Jira CSV protection adds an apostrophe at the start of such cells. A summary that starts with a dash therefore shows the apostrophe in Jira.
- Share files are not encrypted. Do not put confidential information in a plan you share.
