# Obesity-Learning-Explorer

[![CI-CD](https://github.com/vedvpande/Obesity-Learning-Explorer/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/vedvpande/Obesity-Learning-Explorer/actions/workflows/ci-cd.yml)

A learning project for students: look up, compare and understand adult obesity trends by country, and copy facts with their source. For education only; it does not diagnose or give medical advice, and it never stores real patient or health data.

## How we ship

1. **Branch:** every change starts on a `feature/<name>` branch made from `dev`.
2. **Pull request into `dev`:** the `quality` check runs lint, typecheck, tests, build and `npm audit`. It must pass before merging; direct pushes to `dev`, `test` and `main` are blocked by a ruleset.
3. **Promote:** merge `dev` → `test`, check staging, then `test` → `main`.
4. **Deploy:** after each merge, GitHub Actions deploys to Netlify automatically:

| Branch | Environment | Address |
|---|---|---|
| `dev` | development | https://dev--obesity-explorer-ved.netlify.app |
| `test` | staging | https://test--obesity-explorer-ved.netlify.app |
| `main` | production | https://obesity-explorer-ved.netlify.app |

Check a deploy at `/api/health` on any address. It answers `{"status":"ok","env":"<environment>"}`.

Production deploys use Netlify credits, so we merge to `main` at most twice a week. Secrets live only in GitHub environment secrets, never in the code.
