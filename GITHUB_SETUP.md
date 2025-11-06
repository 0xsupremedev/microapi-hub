# GitHub Setup Instructions

## Prerequisites

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it: `microapi-hub` (or your preferred name)
   - Make it public (for hackathon submission)
   - Do NOT initialize with README, .gitignore, or license

## Push to GitHub

### Step 1: Add Remote Repository

```bash
cd "C:\Users\ashut\OneDrive\Documents\MicroAPI Hub"
git remote add origin https://github.com/YOUR_USERNAME/microapi-hub.git
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 2: Stage and Commit Files

Since node_modules has path length issues on Windows, we'll exclude it:

```bash
# Add all files except node_modules
git add --all
git reset -- node_modules/ clients/web/node_modules/ clients/web/.next/

# Commit
git commit -m "Initial commit: Complete MicroAPI Hub implementation

- Full x402 protocol integration for Solana
- Facilitator service with payment verification & settlement
- Provider API with payment protection
- Web UI with wallet integration (Phantom, Solflare)
- Payment modal and transaction history
- On-chain registry contract (Anchor)
- Comprehensive documentation (API, Developer Guide, Hackathon)
- Code examples in TypeScript, Python, Go
- Complete test suite"
```

### Step 3: Push to GitHub

```bash
git branch -M main
git push -u origin main
```

### Step 4: Add .gitignore (if not already committed)

The .gitignore file should already exclude:
- `node_modules/`
- `.next/`
- `dist/`
- `.env` files
- Build artifacts

### Step 5: Verify Repository

After pushing, verify your repository at:
`https://github.com/YOUR_USERNAME/microapi-hub`

## Repository Description

When creating the GitHub repository, use this description:

```
Complete x402 (Solana) payment protocol implementation for API monetization. Built for Solana X402 Hackathon. Features facilitator service, provider API, web UI with wallet integration, and on-chain registry.
```

## Topics/Tags for GitHub

Add these topics to your repository:
- `x402`
- `solana`
- `blockchain-payments`
- `api-monetization`
- `anchor`
- `nextjs`
- `typescript`
- `web3`
- `solana-hackathon`
- `payment-protocol`
- `rust`
- `react`

## Repository Settings

1. **Enable GitHub Pages** (optional):
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` / `docs`

2. **Add README badges** (if needed):
   - The README already includes badges for licenses, tech stack, etc.

3. **Set up GitHub Actions** (optional):
   - For CI/CD workflows
   - For automated testing

## Troubleshooting

### If you get "filename too long" errors:

```bash
# Configure git for long paths
git config --global core.longpaths true

# Or use sparse-checkout to exclude node_modules
git sparse-checkout init
git sparse-checkout set '/*' '!node_modules'
```

### If you need to exclude large files:

```bash
# Add to .gitignore
echo "node_modules/" >> .gitignore
echo ".next/" >> .gitignore
echo "dist/" >> .gitignore
echo "*.log" >> .gitignore

# Remove from git if already tracked
git rm -r --cached node_modules/
git rm -r --cached clients/web/.next/
```

## Next Steps After Push

1. **Add License**: Add a LICENSE file (MIT recommended)
2. **Create Releases**: Tag releases for milestones
3. **Add Issues Template**: Create issue templates for bugs/features
4. **Add Contributing Guide**: Create CONTRIBUTING.md
5. **Update README**: Ensure all links point to your repository

## Demo Video Link

After creating your demo video, add it to:
- README.md (in the Hackathon section)
- HACKATHON.md
- GitHub repository description

