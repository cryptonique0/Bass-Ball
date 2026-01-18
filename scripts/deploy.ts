import { deployments } from 'hardhat';

async function main() {
  console.log('Deploying Bass Ball contracts to Base Chain...');

  // Deploy Game Token
  const GameToken = await ethers.getContractFactory('GameToken');
  const gameToken = await GameToken.deploy();
  await gameToken.deployed();
  console.log('✓ GameToken deployed to:', gameToken.address);

  // Deploy Player NFT
  const PlayerNFT = await ethers.getContractFactory('FootballPlayerNFT');
  const playerNFT = await PlayerNFT.deploy();
  await playerNFT.deployed();
  console.log('✓ FootballPlayerNFT deployed to:', playerNFT.address);

  // Save deployment addresses
  const deploymentInfo = {
    gameToken: gameToken.address,
    playerNFT: playerNFT.address,
    network: 'base',
    timestamp: new Date().toISOString(),
  };

  console.log('\n=== Deployment Summary ===');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for frontend
  const fs = require('fs');
  fs.writeFileSync(
    './lib/contract-addresses.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log('\n✓ Contract addresses saved to lib/contract-addresses.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
