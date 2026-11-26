# Secret scan of the full git history

Date: 2026-11-26. Tool: gitleaks 8.30.1 (default rules). Scanned: all refs, up to `5968478` (tag `pa2`).

## Result

| Check                                                        | Result                    |
| ------------------------------------------------------------ | ------------------------- |
| `gitleaks git --log-opts="--all"` (every commit, every ref)  | **no leaks found**        |
| `gitleaks dir .` (working tree)                              | **no leaks found**        |
| `.env`-like files ever committed                             | only `.env.example`       |
| `GROQ_API_KEY` occurrences in history                        | 6, all names, no value    |
| Positive control: a fake `gsk_…` Groq key in a throwaway dir | caught (`leaks found: 1`) |

No secret has ever been committed, so no key needed rotating.

gitleaks reports 12 commits scanned. The repository has 14 non-merge commits; the other two
(`1dc7bb0` adding the rubric PDFs, and `569569a`) add no text lines, only binary files, so there
is nothing in them for a secret rule to match.

## How to re-run

```sh
brew install gitleaks                                    # or see github.com/gitleaks/gitleaks
gitleaks git --log-opts="--all" --redact --no-banner -v .   # full history, exit 0 = clean
gitleaks dir --redact --no-banner .                        # working tree
```

`--redact` hides the matched text, so a real secret would not be printed to the terminal or a log.
