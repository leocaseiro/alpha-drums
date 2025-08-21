# Branch Protection Setup

Go to: **Settings → Branches → Add rule** for `main` branch

## Required Settings:
- ✅ **Require a pull request before merging**
- ✅ **Require status checks to pass before merging**
  - Select: `lint-and-build` (from push-test.yml)
  - Select: `build` (from deploy.yml) 
- ✅ **Require up-to-date branches before merging**
- ✅ **Include administrators** (optional)

## Auto-merge Settings:
- ✅ **Allow auto-merge**
- ✅ **Automatically delete head branches**

## How to use:
1. Create PR
2. Click "Enable auto-merge" in the PR
3. PR automatically merges when all checks pass