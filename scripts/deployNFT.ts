import { ethers } from 'hardhat';

async function main() {
  console.log('Deploying BassballPlayerNFT contract to Base network...');

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Get balance
  const balance = await deployer.getBalance();
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

  // Deploy contract
  const BassballPlayerNFT = await ethers.getContractFactory('BassballPlayerNFT');
  const nft = await BassballPlayerNFT.deploy();

  await nft.deployed();

  console.log(`✅ BassballPlayerNFT deployed to: ${nft.address}`);

  // Verify on Base Etherscan (optional)
  console.log(`\nVerify with: npx hardhat verify --network base ${nft.address}`);

  // Save contract address to file
  const fs = require('fs');
  const config = {
    network: 'base',
    contractAddress: nft.address,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  fs.writeFileSync('deployment.json', JSON.stringify(config, null, 2));
  console.log('\n✅ Deployment config saved to deployment.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
