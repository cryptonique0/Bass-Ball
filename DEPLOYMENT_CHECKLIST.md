# 🚀 Deployment Checklist

## Pre-Deployment

### Local Testing
- [ ] Run `npm run dev` and verify game loads
- [ ] Test gameplay mechanics (pass, shoot, scoring)
- [ ] Verify Tailwind CSS styling is correct
- [ ] Check responsive design on mobile

### Smart Contracts
- [ ] Review contract code for security issues
- [ ] Run contract tests: `npm run contracts:test`
- [ ] Compile contracts: `npm run contracts:compile`
- [ ] Verify no TypeScript errors: `npm run lint`

### Configuration
- [ ] Copy `.env.example` to `.env.local`
- [ ] Set `PRIVATE_KEY` for contract deployment
- [ ] Set correct `NEXT_PUBLIC_BASE_CHAIN_ID`
- [ ] Verify all environment variables

## Testnet Deployment (Base Sepolia)

### Step 1: Prepare Wallet
- [ ] Import wallet with test ETH
- [ ] Fund wallet with Sepolia ETH
- [ ] Add Base Sepolia network to MetaMask
  - Network: Base Sepolia
  - RPC URL: https://sepolia.base.org
  - Chain ID: 84532
  - Currency: ETH

### Step 2: Deploy Contracts
```bash
npm run contracts:compile
npm run contracts:deploy --network baseSepolia
```

- [ ] Verify deployment successful
- [ ] Copy contract addresses from output
- [ ] Save addresses safely

### Step 3: Update Environment
- [ ] Update `.env.local` with contract addresses
```
NEXT_PUBLIC_PLAYER_NFT_ADDRESS=0x...
NEXT_PUBLIC_GAME_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_BASE_CHAIN_ID=84532
```

### Step 4: Test on Testnet
- [ ] Start dev server: `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Connect wallet to Base Sepolia
- [ ] Verify game loads correctly
- [ ] Test Web3 wallet integration

### Step 5: Verify on BaseScan
- [ ] Visit https://sepolia.basescan.org
- [ ] Search for contract addresses
- [ ] Verify contract source code matches
- [ ] Document contract links

## Production Deployment (Base Mainnet)

### Security Review
- [ ] Have contracts audited (optional but recommended)
- [ ] Review all access controls
- [ ] Test all edge cases
- [ ] Check for reentrancy vulnerabilities

### Prepare for Mainnet
- [ ] Ensure wallet has sufficient mainnet ETH
- [ ] Switch to mainnet network
- [ ] Update environment for production:
```
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_DEV_MODE=false
```

### Deploy Contracts to Mainnet
```bash
# Update hardhat.config.ts to use mainnet RPC
npm run contracts:deploy --network base
```

- [ ] Verify transaction on BaseScan
- [ ] Save mainnet contract addresses
- [ ] Update `.env.local` production variables

### Frontend Deployment

#### Option 1: Deploy to Vercel (Recommended)
```bash
npm run build
# Commit and push to GitHub
# Vercel auto-deploys on push
```

Configuration:
- [ ] Connect GitHub repository
- [ ] Set environment variables in Vercel dashboard
- [ ] Enable auto-deployments
- [ ] Configure domain

#### Option 2: Self-Hosted
```bash
# Build production bundle
npm run build

# Deploy to your server
scp -r .next/* user@server:/var/www/bass-ball/
```

### Post-Deployment

#### Verification
- [ ] Test game at production URL
- [ ] Connect real wallet (MetaMask)
- [ ] Switch to Base mainnet
- [ ] Verify contract interaction
- [ ] Test gameplay flow

#### Monitoring
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Monitor contract events
- [ ] Track user analytics
- [ ] Set up monitoring dashboard

#### Documentation
- [ ] Update docs with mainnet addresses
- [ ] Create user guide
- [ ] Set up FAQ section
- [ ] Publish deployment announcement

## Mainnet Launch Checklist

### 24 Hours Before Launch
- [ ] Final security review
- [ ] Load testing on staging
- [ ] Backup all important data
- [ ] Prepare announcement

### Launch Day
- [ ] Deploy to production at scheduled time
- [ ] Monitor for errors/issues
- [ ] Have support team on standby
- [ ] Announce on social media
- [ ] Track early user feedback

### Post-Launch (24-48 hours)
- [ ] Monitor transaction volume
- [ ] Check contract gas usage
- [ ] Review user feedback
- [ ] Address critical issues quickly
- [ ] Celebrate launch! 🎉

## Contract Verification

### Verify on BaseScan

```bash
# Install Hardhat Verify
npm install --save-dev @nomiclabs/hardhat-etherscan

# Verify contract
npx hardhat verify --network base <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

Steps:
- [ ] Get contract address from deployment
- [ ] Get constructor arguments
- [ ] Run verify command
- [ ] Check BaseScan for verification

## Rollback Plan

If issues occur:
1. [ ] Pause contract if necessary (add emergency pause function)
2. [ ] Document the issue
3. [ ] Fix in contracts/code
4. [ ] Redeploy to testnet first
5. [ ] Test thoroughly
6. [ ] Deploy fix to mainnet
7. [ ] Communicate with users

## Security Checklist

### Before Any Deployment
- [ ] No hardcoded secrets in code
- [ ] Private key only in `.env` files
- [ ] Git never commits `.env.local`
- [ ] Contract code reviewed
- [ ] No obvious vulnerabilities
- [ ] Timelock mechanism for upgrades
- [ ] Emergency pause function

### Access Control
- [ ] Owner addresses documented
- [ ] Multisig for critical functions
- [ ] Non-upgradeable contracts preferred
- [ ] Events logged for all state changes

## Useful Commands

```bash
# Check network connection
npx hardhat accounts --network baseSepolia

# Get contract details
npx hardhat run scripts/deploy.ts --network baseSepolia

# Interact with contract
npx hardhat console --network base

# View transaction
# https://basescan.org/tx/<TX_HASH>

# View contract
# https://basescan.org/address/<CONTRACT_ADDRESS>
```

## Support Contacts

- **Base Team**: https://base.org/contact
- **Hardhat Support**: https://github.com/nomiclabs/hardhat
- **MetaMask Help**: https://support.metamask.io
- **BaseScan API**: https://basescan.org/apis

## Post-Deployment Monitoring

### Key Metrics to Track
- [ ] Daily active users
- [ ] Contract transaction volume
- [ ] Gas usage trends
- [ ] Error rates
- [ ] User feedback sentiment

### Tools
- [ ] Google Analytics (frontend)
- [ ] Etherscan API (contract monitoring)
- [ ] Sentry (error tracking)
- [ ] Discord bot for alerts

---

**Ready to launch? Follow this checklist step-by-step!** 🚀
