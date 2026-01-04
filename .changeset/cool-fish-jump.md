---
'@glxmart/boss-cli': minor
---

Add pre-bootstrap 1Password setup and fix vault inconsistencies

- Add automated 1Password setup script (./scripts/setup-1password.sh)
- Fix vault inconsistency: standardize on 'boss' vault everywhere
- Update BOSS-HOST-SETUP.md with clear pre-bootstrap setup instructions
- Add setup-scripts generator to include setup script in bootstrapped projects
- Update bootstrap success message to guide users through 1Password setup
- Add comprehensive E2E test script for all project types

This ensures users have a smooth setup experience with clear CLI-based instructions for creating required 1Password vault and secrets BEFORE running start-boss.sh.
