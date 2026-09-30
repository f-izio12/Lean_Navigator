# Lean_Navigator
This is a tool for Lean Management
# Lean Navigator

A local-first workspace for Lean and Six Sigma improvement projects. It runs in your browser, can be installed as an app, and keeps your data encrypted on your own device.

**Methods included**

- **DMAIC** with charter, SIPOC, voice of the customer, data collection plan, measurement system check, baseline and capability, process map, fishbone, 5 Whys, Pareto, hypothesis tests (2-sample and paired t-test, ANOVA, chi-square, 2-proportion test, correlation and regression), solutions, FMEA, pilot, control plan and control chart.
- **A3 problem solving** (Plan, Do, Check, Act) with a one-page A3 PDF.
- **Kaizen event** (Prepare, Event, Follow-up) with waste walk, try-storming, before-and-after results and sustain audits.
- **Value stream mapping** (current state, future state, plan) with takt time, lead time, process cycle efficiency and an automatically drawn map.

Every stage has a checkpoint (tollgate, mentor check or review), instant quality checks, an explanation of what to fill in, and a PDF report. An optional AI advisor suggests which method to start with and gives a strict black belt review of each stage.

## Privacy in one paragraph

There is no server and no account. Projects and settings, including any AI key, are encrypted in the browser with AES-GCM using a key protected by your passphrase. Nothing leaves your device unless you (a) connect an AI provider, in which case the text of your request goes directly to that provider, or (b) save a backup or synced file, which contains the same encrypted data.

## Using it

1. Open the app (your GitHub Pages address, see below).
2. Choose a passphrase. The app shows a **recovery code** once: store it in a password manager or print it. If you forget your passphrase, the recovery code is the only way back in. There is no password reset by email, because there is no server.
3. Optionally choose a **file to keep in sync** (Chrome and Edge on a computer). Pick a location on your laptop or in a synced folder such as SURFdrive, OneDrive or Dropbox. The app writes to it after every change and reads the newest copy when it starts, so you can use it on more than one computer.
4. Optionally connect an **AI provider** in Settings.

### Install it as an app

- **Chrome or Edge (Windows, macOS, Linux):** open the app, then click the install icon at the right of the address bar, or menu, then "Install Lean Navigator".
- **Safari on macOS:** File, then "Add to Dock".
- **iPhone or iPad:** Share, then "Add to Home Screen".
- **Android (Chrome):** menu, then "Install app".

Once installed it opens in its own window and works offline (the AI features need a connection).

### Keeping your data safe

Browsers can delete website data: when disk space runs low, when someone clears browsing data, or in Safari after 7 days without use unless the app is installed. The app asks the browser to protect its storage, but the browser may refuse. Protect yourself in one of two ways:

| Browser | Automatic sync to a file | Manual backup |
|---|---|---|
| Chrome, Edge (computer) | Yes | Yes |
| Firefox, Safari, mobile browsers | No | Yes, with a reminder after 7 days |

Backups and synced files are encrypted. To move to a new computer, open the app there and choose "Open and keep syncing a vault file" or "Restore from a backup file", then enter your passphrase.

## AI providers

Settings, then AI provider. Choose a provider, type the model name exactly as your provider's documentation writes it, paste your API key and press **Test and save**. Usage is billed by the provider on your own account.

| Provider | Adapter | Notes |
|---|---|---|
| Anthropic (Claude) | Anthropic | Browser access supported (the app sends the required header). |
| OpenAI | OpenAI-compatible | |
| Google (Gemini) | Gemini | |
| Moonshot (Kimi), Mistral, DeepSeek | OpenAI-compatible | Not verified. Some providers block requests made directly from a browser (CORS). If the test fails with "Could not reach the provider", use OpenRouter instead. |
| OpenRouter | OpenAI-compatible | One key for many models from different companies. |
| Ollama, LM Studio (local) | OpenAI-compatible | No data leaves your computer. Ollama must allow your site: start it with `OLLAMA_ORIGINS=https://YOUR-NAME.github.io ollama serve`. |
| Anything else OpenAI-compatible | OpenAI-compatible | Choose "Other" and enter its base URL. |

Your API key sits encrypted in your vault, but while the app is unlocked it is in the browser's memory and is sent to the provider with each request. Use a key with a spending limit.

## Publish your own copy on GitHub Pages

No programming needed.

1. Create a free account at [github.com](https://github.com) if you do not have one.
2. Click **+** (top right), then **New repository**. Name it `lean-navigator`, set it to **Public**, and click **Create repository**.
3. On the new repository page, click **uploading an existing file**. Drag in **all files and folders** from this project (`index.html`, `sw.js`, `manifest.webmanifest`, `css`, `js`, `vendor`, `icons`, `README.md`, `LICENSE`). Click **Commit changes**.
4. Go to **Settings**, then **Pages** (left menu). Under "Build and deployment", set Source to **Deploy from a branch**, Branch to **main** and folder to **/ (root)**. Click **Save**.
5. Wait one or two minutes and refresh the page. GitHub shows the address, usually `https://YOUR-NAME.github.io/lean-navigator/`. Open it and install it as described above.

### Publishing an update

Upload the changed files in the same way. Then open `sw.js`, change `VERSION` (for example to `lean-navigator-1.0.1`) and commit. Users get the new version the next time they open the app while online.

### Running it on your own computer

Service workers and encryption need `https` or `localhost`, so opening `index.html` by double-clicking is not enough. From the project folder run:

```
python3 -m http.server 8000
```

and open `http://localhost:8000`.

## Project structure

```
index.html              page shell
css/app.css             styles (default theme: dark blue #001C3D, orange-red #E84E10, light blue #00A2DB)
js/core.js              registry, helpers, statistics
js/charts.js            SVG charts shared by screen and PDF
js/ui.js                library, advisor, project workspace, checkpoints, review
js/dmaic.js, a3.js, kaizen.js, vsm.js   the four methods
js/hyp.js               hypothesis tests
js/info.js              step explanations
js/pdf.js               PDF reports and email draft
js/vault.js             encryption, storage, file sync
js/ai.js                AI provider adapters
js/app.js               start-up, vault screens, settings
vendor/                 jsPDF and jsPDF-AutoTable (MIT)
sw.js, manifest.webmanifest, icons/   installable app
```

To add a method, create a file like `js/kaizen.js`: register the tool with its stages, tabs, checklists and blank data, then add its PDF sections in `js/pdf.js`.

## Limits

- Statistics cover the common tests. Non-parametric and exact tests are not included.
- The value stream map is drawn from a table, not by dragging boxes. Information flows are described in text.
- Losing both the passphrase and the recovery code means the data cannot be recovered by anyone.

## Licence and disclaimer

MIT licence, see `LICENSE`. This is an independent project. It is not affiliated with, endorsed by or supported by Maastricht University. The default colour theme follows a common academic house style; the font falls back to Verdana, and no third-party fonts or logos are included.
