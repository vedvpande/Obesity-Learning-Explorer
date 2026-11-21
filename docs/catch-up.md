# Catch-up: Weeks 1–4

To continue in a new conversation, paste: "Read docs/catch-up.md and continue."

## About me and my app

- **App name:** Obesity Learning Explorer
- **Idea:** One simple place for students to look up, compare and understand adult obesity trends by country, and copy facts with their source. For learning only; never diagnoses or gives medical advice.
- **GitHub username:** vedvpande
- **Computer:** Mac
- **Repository:** https://github.com/vedvpande/Obesity-Learning-Explorer
- **Netlify project:** obesity-explorer-ved
  - dev: https://dev--obesity-explorer-ved.netlify.app
  - test: https://test--obesity-explorer-ved.netlify.app
  - production: https://obesity-explorer-ved.netlify.app

## How we work

- One small step at a time; check it worked, then continue.
- Claude runs terminal commands (with my permission); I do the browser clicks.
- Never paste passwords, tokens or secrets into chat. Never read .env files.
- Git: main = production, test = staging, dev = integration. Only work on `feature/<short-name>` branches, then a pull request into dev. Check `git branch --show-current` before every commit. Never `git push --force` or `git reset --hard`.

## Checklist

### Week 1: Setup and my idea

- [x] 1. Git and Node.js installed (Git 2.39.3, Node 24.22.1, npm 11.19.1)
- [x] 2. Product brief (approved; new version written to docs/brief.md, not committed yet, so it gets committed in step 8)

### Week 2: Git, GitHub and my project

- [x] 3. Git name and GitHub noreply email (Ved Pande, 347169019+vedvpande@users.noreply.github.com)
- [x] 4. Repository on GitHub, cloned in VS Code (Public, created 2026-10-31 with README and .gitignore; folder /Users/vedpande/Downloads/Repo/Obesity-Learning-Explorer. Name uses capitals instead of lowercase; kept so links don't break)
- [x] 5. App scaffolded (React, Vite, TypeScript, Tailwind, Router, ESLint, Prettier, Vitest). Lint, typecheck, 155 tests and build all pass
- [x] 6. App starts at http://localhost:5173 (Explorer > NPM SCRIPTS > ▶ next to dev)
- [x] 7. CLAUDE.md (product line, commands and Git rule updated on branch feature/catch-up-setup; commit at end of step 8)
- [x] 8. .claude/settings.json, docs/brief.md, PR template, .gitignore (all present; added .DS_Store to .gitignore and removed the committed .DS_Store)
- [x] 9. Setup commit (on feature/catch-up-setup with a PR into dev, because main is protected now)
- [ ] 10. dev and test branches
- [ ] 11. Landing page (feature/landing-page → PR into dev)
- [ ] 12. One GitHub Issue per main feature

### Week 3: Specs, AI team and screens

- [ ] 13. Four agents in .claude/agents
- [ ] 14. User stories and acceptance criteria in each Issue
- [ ] 15. Main screens with mock data, one PR each
- [ ] 16. About page

### Week 4: Put my app on the internet

- [ ] 17. Netlify project, Project ID, access token
- [ ] 18. GitHub secrets and environments
- [ ] 19. Pipeline (feature/pipeline → PR into dev), dev address and /api/health
- [ ] 20. Release dev → test → main, all addresses checked
- [ ] 21. Ruleset protect-main-test-dev, tested
- [ ] 22. README badge and "How we ship"

## Notes

- Netlify login is stored in the Mac keychain. Neon CLI login is stored in `~/.neon` (use `--config-dir ~/.neon`), because `~/.config` is owned by root.
