# Fix: install.sh 404 / "No published release found for codemint/codemint-cli"

## Cause

The install script in **neghani/code-mint-cli** defaults to the wrong GitHub repo:

```sh
REPO="${CODEMINT_REPO:-codemint/codemint-cli}"   # wrong — this org/repo does not exist or has no release
```

So when users run:

```sh
curl -fsSL https://github.com/neghani/code-mint-cli/releases/latest/download/install.sh | sh
```

the script then tries to fetch releases/source from **codemint/codemint-cli** and gets 404.

## Fix (in the CLI repo) — DONE

In **neghani/code-mint-cli**, `scripts/install.sh` uses `REPO="${CODEMINT_REPO:-neghani/code-mint-cli}"`. A root **`install.sh`** was added so both URLs work:

- `https://raw.githubusercontent.com/neghani/code-mint-cli/main/install.sh`
- `https://raw.githubusercontent.com/neghani/code-mint-cli/main/scripts/install.sh`

Releases attach `dist/install.sh` (copy of `scripts/install.sh`) so `releases/latest/download/install.sh` works.

## Workaround (no CLI repo change needed)

This app serves a **fixed** install script at **`/cli/install.sh`** (REPO=neghani/code-mint-cli). Use the one-liner from the landing page:

```sh
curl -fsSL https://<this-site>/cli/install.sh | sh
```

Replace `<this-site>` with your deployed app URL (e.g. `app.codemint.ai` or your Netlify URL). The landing page shows the full command with the correct origin.

Alternatively, with the GitHub script:

```sh
CODEMINT_REPO=neghani/code-mint-cli curl -fsSL https://github.com/neghani/code-mint-cli/releases/latest/download/install.sh | sh
```

Or download a binary from [releases](https://github.com/neghani/code-mint-cli/releases/latest).
