# Lean Navigator

A local-first workspace for Lean and Six Sigma improvement projects. It runs in your browser, can be installed as an app, and keeps your data encrypted on your own device.

**Methods included**

- **DMAIC** with charter, SIPOC, voice of the customer, data collection plan, measurement system check, baseline and capability, process map, fishbone, 5 Whys, Pareto, hypothesis tests (2-sample and paired t-test, ANOVA, chi-square, 2-proportion test, correlation and regression), solutions, FMEA, pilot, control plan and control chart.
- **A3 problem solving** (Plan, Do, Check, Act) with a one-page A3 PDF.
- **Kaizen event** (Prepare, Event, Follow-up) with waste walk, try-storming, before-and-after results and sustain audits.
- **Value stream mapping** (current state, future state, plan) with takt time, lead time, process cycle efficiency and an automatically drawn map.
- **DMADV** (Define, Measure, Analyse, Design, Verify) for new processes and services: Kano analysis, CTQs with limits, Pugh matrix, House of Quality, design FMEA, design scorecard and CTQ verification.
- **PDCA** in fast cycles, each with a prediction, result, learning and an adopt, adapt or abandon decision.
- **Digital 5S** for shared drives, mailboxes and team sites, with a 15-point audit, red-tag list, retention check and radar chart.

Every stage has a checkpoint (tollgate, mentor check or review), instant quality checks and an explanation of what to fill in. Every project also has a **Plan and Gantt** view (work packages, stories, sub-tasks, milestones and finish-to-start dependencies), **Stakeholders** (power and interest grid) and a **RACI**.

Above the projects sit two portfolio pages:

- **Pipeline**: collect improvement ideas, score them on benefit and effort, link them to a strategic priority, and decide: start as a project (with a method, or ask the advisor), move to the **Just do it** log, park or reject.
- **Strategy (Hoshin Kanri)**: plans at the levels you define, for example organisation, division and team. Breakthrough objectives, annual objectives, improvement priorities and metrics are linked level by level, shown as matrices, and tracked month by month against a straight-line plan. Projects and ideas link to priorities, so you see which priorities have no work behind them.

**Catchball between levels** works with share files: the owner of a plan exports a share file, the level below imports it as its parent plan (read-only) and links its own objectives to it. Share files are not encrypted, because they are meant to be shared.

**Export** (one button, several formats): PDF report, Excel workbook, Jira Cloud import file (CSV), agile backlog in Excel, and an email draft. Exports are one-way: once tasks are in Excel or Jira, they live there. An optional AI advisor suggests which method to start with and gives a strict black belt review of each stage.

## Privacy in one paragraph

There is no server and no account. Projects and settings, including any AI key, are encrypted in the browser with AES-GCM using a key protected by your passphrase. Nothing leaves your device unless you (a) connect an AI provider, in which case the text of your request goes directly to that provider, or (b) save a backup or synced file, which contains the same encrypted data.

## Using it

1. Open the app (your GitHub Pages address, see below).
2. Choose a passphrase. The app shows a **recovery code** once: store it in a password manager or print it. If you forget your passphrase, the recovery code is the only way back in. There is no password reset by email, because there is no server.
3. Optionally choose a **file to keep in sync** (Chrome and Edge on a computer). Pick a location on your laptop or in a synced folder such as OneDrive, Google Drive or Dropbox. The app writes to it after every change and reads the newest copy when it starts, so you can use it on more than one computer.
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

## Importing the plan into Jira Cloud

Export, then "Jira Cloud import file (CSV)". Work packages become epics, stories stay stories, sub-tasks are linked to their story through the Parent column (Issue ID of the parent row, as Jira Cloud expects), and dependencies go in "Blocked by" columns. The app shows the import steps after saving the file. Notes: the CSV import usually needs Jira administrator rights; assignees only map when names match Jira users exactly; test in a test project first.

## Publish your own copy on GitHub Pages

No programming needed.

1. Create a free account at [github.com](https://github.com) if you do not have one.
2. Click **+** (top right), then **New repository**. Name it `lean-navigator`, set it to **Public**, and click **Create repository**.
3. On the new repository page, click **uploading an existing file**. Drag in **all files and folders** from this project (`index.html`, `sw.js`, `manifest.webmanifest`, `css`, `js`, `vendor`, `fonts`, `icons`, `README.md`, `LICENSE`). Click **Commit changes**.
4. Go to **Settings**, then **Pages** (left menu). Under "Build and deployment", set Source to **Deploy from a branch**, Branch to **main** and folder to **/ (root)**. Click **Save**.
5. Wait one or two minutes and refresh the page. GitHub shows the address, usually `https://YOUR-NAME.github.io/lean-navigator/`. Open it and install it as described above.

### Publishing an update

Upload the changed files in the same way. Then open `sw.js`, change `VERSION` (for example to `lean-navigator-1.2.2`) and commit. Also update `APP_VERSION` at the top of `js/app.js`, which is the number shown in Settings. Users get the new version the next time they open the app while online.

### Running it on your own computer

Service workers and encryption need `https` or `localhost`, so opening `index.html` by double-clicking is not enough. From the project folder run:

```
python3 -m http.server 8000
```

and open `http://localhost:8000`.

## Project structure

```
index.html              page shell
css/app.css             styles (palette: blue #0C2145, gold #C3B598, cream #FFFCF0; typeface Jost)
fonts/                  Jost typeface (woff2) and its licence
js/core.js              registry, helpers, statistics
js/charts.js            SVG charts shared by screen and PDF
js/ui.js                library, advisor, project workspace, checkpoints, review
js/dmaic.js, a3.js, kaizen.js, vsm.js, dmadv.js, pdca.js, fives.js   the methods
js/hyp.js               hypothesis tests
js/info.js              step explanations
js/pdf.js               PDF reports and email draft
js/vault.js             encryption, storage, file sync
js/ai.js                AI provider adapters
js/plan.js              plan, dependencies and Gantt
js/people.js            stakeholders and RACI
js/export.js            export menu, Excel, Jira CSV, backlog
js/security.js          validation of imported files and restored vaults
js/app.js               start-up, vault screens, settings
vendor/                 jsPDF, jsPDF-AutoTable and ExcelJS (all MIT)
sw.js, manifest.webmanifest, icons/   installable app
```

To add a method, create a file like `js/kaizen.js`: register the tool with its stages, tabs, checklists and blank data, then add its PDF sections in `js/pdf.js`.

## Security

See `SECURITY.md` for the security model and how to report a vulnerability privately. In short: external files (share files, backups) are validated before use, all text is escaped, and a Content-Security-Policy blocks inline scripts.

## Design and accessibility

The palette is blue #0C2145, gold #C3B598 and cream #FFFCF0, with the Jost typeface. Gold does not have enough contrast for text on a light background, so it is used on blue and for decoration; a darker gold (#7A6A3E) is used for links and accents on light backgrounds, and a rust red (#A3422A) for warnings. The app follows a light or dark appearance according to the system setting.

## Limits

- Statistics cover the common tests. Non-parametric and exact tests are not included.
- The value stream map is drawn from a table, not by dragging boxes. Information flows are described in text.
- Losing both the passphrase and the recovery code means the data cannot be recovered by anyone.

## Licence and disclaimer

MIT licence, see `LICENSE`.

Third-party components: jsPDF, jsPDF-AutoTable and ExcelJS (MIT licence), and the Jost typeface by The Jost Project Authors (SIL Open Font License 1.1, see `fonts/OFL.txt`). The font is included in the repository, so no requests are made to external font services.
