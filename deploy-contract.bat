@echo off
cd /d %~dp0
echo Current directory: %CD%
npx hardhat run scripts/deploy.js --network localhost 