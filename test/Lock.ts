import { loadFixture, ethers, expect, network } from './setup';
import { IERC20__factory } from '../typechain-types';
import { token } from '../typechain-types/@openzeppelin/contracts';

describe("test staking contract", async function() {

  async function deploy() {
    const ethUser = await ethers.getImpersonatedSigner("0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503");

    const factory = await ethers.getContractFactory("Staking", ethUser);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    await contract.initialize(ethUser.address);

    return { ethUser, contract };
  }

  it("should add token for staking", async function() {
    const { ethUser, contract } = await loadFixture(deploy);

    const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const usdt = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

    await expect(contract.addNewToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(contract, "AddressIsEmpty")

    await contract.connect(ethUser).addNewToken(usdc);

    expect(await contract.connect(ethUser).getAvailableToken(usdc)).to.equal(true);
    expect(await contract.connect(ethUser).getAvailableToken(usdt)).to.equal(false)
  });

  it("should add tokens for staking reward", async function() {
    const { ethUser, contract } = await loadFixture(deploy);

    const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const usdt = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

    await expect(contract.addNewToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(contract, "AddressIsEmpty")

    await contract.connect(ethUser).addNewToken(usdc);

    expect(await contract.connect(ethUser).getAvailableToken(usdc)).to.equal(true);
    expect(await contract.connect(ethUser).getAvailableToken(usdt)).to.equal(false)

    const token = IERC20__factory.connect(usdc, ethUser);

    const usdcAmount = "100"; 
    const usdcDecimals = 6; 
    const usdcAmountInWei = ethers.parseUnits(usdcAmount, usdcDecimals);

    await token.connect(ethUser).approve(contract.getAddress(), usdcAmountInWei);

    const allowance = await token.allowance(ethUser.getAddress(), contract.getAddress());
    expect(allowance).to.equal(usdcAmountInWei);

    await expect(contract.connect(ethUser).addTokensAmountForStakingReward(usdt, usdcAmountInWei)).to.be.revertedWithCustomError(contract, "TokenNotAvailable")

    await contract.connect(ethUser).addTokensAmountForStakingReward(usdc, usdcAmountInWei);

    expect(await contract.getBalanceOfContractToken(usdc)).to.equal(usdcAmountInWei);
  });

  it("should start staking usdt", async function() {
    const { ethUser, contract } = await loadFixture(deploy);

    const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const usdt = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

    await expect(contract.addNewToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(contract, "AddressIsEmpty")

    await contract.connect(ethUser).addNewToken(usdt);

    expect(await contract.connect(ethUser).getAvailableToken(usdc)).to.equal(false);
    expect(await contract.connect(ethUser).getAvailableToken(usdt)).to.equal(true)

    const token = IERC20__factory.connect(usdt, ethUser);

    const usdtAmount = "100"; 
    const usdtDecimals = 6; 
    const usdtAmountInWei = ethers.parseUnits(usdtAmount, usdtDecimals);

    // Approve the contract to spend USDT tokens
    await token.approve(contract.getAddress(), usdtAmountInWei);

    await expect(contract.connect(ethUser).addTokensAmountForStakingReward(usdc, usdtAmountInWei)).to.be.revertedWithCustomError(contract, "TokenNotAvailable")

    await contract.connect(ethUser).addTokensAmountForStakingReward(usdt, usdtAmountInWei);

    expect(await contract.getBalanceOfContractToken(usdt)).to.equal(usdtAmountInWei);

    // const stakingUser = await ethers.getImpersonatedSigner("0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503");

    // const usdcStakingAmount = "20"; // 20 USDC
    // const usdcStakingAmountInWei = ethers.parseUnits(usdcStakingAmount, usdcDecimals);

    // await token.connect(stakingUser).approve(contract.getAddress(), usdcStakingAmountInWei);

    // const stakingAllowance = await token.allowance(stakingUser.getAddress(), contract.getAddress());
    // expect(stakingAllowance).to.equal(usdcStakingAmountInWei);

    // await contract.connect(stakingUser).addNewStakingAmount(usdc, usdcStakingAmountInWei);

    // expect(await contract.getBalanceOfContractToken(tokenName)).to.equal(usdcStakingAmountInWei + usdcAmountInWei);

    // const blockNumBefore = await ethers.provider.getBlockNumber();
    // const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    // const timestampBefore = blockBefore?.timestamp;

  
    // const stakingData = await contract.getInvestigationById(await contract.getLastId());
    // expect(stakingData.user).to.equal(await stakingUser.getAddress());
    // expect(stakingData.tokenName).to.equal(tokenName);
    // expect(stakingData.amount).to.equal(usdcStakingAmountInWei);
    // expect(stakingData.startDate).to.equal(timestampBefore)
    // expect(stakingData.endDate).to.equal(0)
  });

  // it("should owner withdraw money", async function() {
  //   const { ethUser, contract } = await loadFixture(deploy);

  //   const tokenName = "USDC";
  //   const tokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  //   await contract.connect(ethUser).addNewToken(tokenAddress, tokenName);

  //   const availableToken = await contract.connect(ethUser).getAvailableToken(tokenName);
  //   expect(availableToken).to.equal(tokenAddress);

  //   const usdcAmountToWithdraw = "50"; 
  //   const usdcDecimalsToWithdraw = 6; 
  //   const usdcAmountInWeiToWithdraw = ethers.parseUnits(usdcAmountToWithdraw, usdcDecimalsToWithdraw);

  //   await expect(contract.connect(ethUser).withdrawTokensFromContract(tokenName, usdcAmountInWeiToWithdraw)).to.be.revertedWith('ERC20: transfer amount exceeds balance')

  //   const token = IERC20__factory.connect(tokenAddress, ethUser);

  //   const usdcAmount = "100"; 
  //   const usdcDecimals = 6; 
  //   const usdcAmountInWei = ethers.parseUnits(usdcAmount, usdcDecimals);

  //   await token.connect(ethUser).approve(contract.getAddress(), usdcAmountInWei);

  //   const allowance = await token.allowance(ethUser.getAddress(), contract.getAddress());
  //   expect(allowance).to.equal(usdcAmountInWei);

  //   await contract.connect(ethUser).addTokensAmountForStakingReward(tokenName, usdcAmountInWei);

  //   const contractBalance = await contract.getBalanceOfContractToken(tokenName);
  //   expect(contractBalance).to.equal(usdcAmountInWei);

  //   const beforeWitdraw = await token.balanceOf(ethUser) 

  //   await expect(contract.connect(ethUser).withdrawTokensFromContract("", usdcAmountInWeiToWithdraw)).to.be.revertedWithCustomError(contract, "TokenNotAvailable")

  //   await contract.connect(ethUser).withdrawTokensFromContract(tokenName, usdcAmountInWeiToWithdraw)

  //   expect(await contract.getBalanceOfContractToken(tokenName)).to.equal(usdcAmountInWeiToWithdraw)
  //   expect(await token.balanceOf(ethUser)).to.equal(beforeWitdraw + usdcAmountInWeiToWithdraw)
  // })

  // it("client should withdraw money with no reward", async function() {
  //   const { ethUser, contract } = await loadFixture(deploy);

  //   const tokenName = "USDC";
  //   const tokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  //   await contract.connect(ethUser).addNewToken(tokenAddress, tokenName);

  //   const availableToken = await contract.connect(ethUser).getAvailableToken(tokenName);
  //   expect(availableToken).to.equal(tokenAddress);

  //   const token = IERC20__factory.connect(tokenAddress, ethUser);

  //   const usdcAmount = "100"; // 100 USDC
  //   const usdcDecimals = 6; 
  //   const usdcAmountInWei = ethers.parseUnits(usdcAmount, usdcDecimals);

  //   await token.connect(ethUser).approve(contract.getAddress(), usdcAmountInWei);

  //   const allowance = await token.allowance(ethUser.getAddress(), contract.getAddress());
  //   expect(allowance).to.equal(usdcAmountInWei);

  //   await contract.connect(ethUser).addTokensAmountForStakingReward(tokenName, usdcAmountInWei);

  //   const contractBalance = await contract.getBalanceOfContractToken(tokenName);
  //   expect(contractBalance).to.equal(usdcAmountInWei);

  //   const stakingUser = await ethers.getImpersonatedSigner("0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503");

  //   const usdcStakingAmount = "20"; // 20 USDC
  //   const usdcStakingAmountInWei = ethers.parseUnits(usdcStakingAmount, usdcDecimals);

  //   await token.connect(stakingUser).approve(contract.getAddress(), usdcStakingAmountInWei);

  //   const stakingAllowance = await token.allowance(stakingUser.getAddress(), contract.getAddress());
  //   expect(stakingAllowance).to.equal(usdcStakingAmountInWei);

  //   await contract.connect(stakingUser).addNewStakingAmount(tokenName, usdcStakingAmountInWei);

  //   expect(await contract.getBalanceOfContractToken(tokenName)).to.equal(usdcStakingAmountInWei + usdcAmountInWei);

  //   const blockNumBefore = await ethers.provider.getBlockNumber();
  //   const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  //   const timestampBefore = blockBefore?.timestamp;

  //   const stakingData = await contract.getInvestigationById(await contract.getLastId());
  //   expect(stakingData.user).to.equal(await stakingUser.getAddress());
  //   expect(stakingData.tokenName).to.equal(tokenName);
  //   expect(stakingData.amount).to.equal(usdcStakingAmountInWei);
  //   expect(stakingData.startDate).to.equal(timestampBefore);
  //   expect(stakingData.endDate).to.equal(0);

  //   await expect(contract.connect(stakingUser).witdrawTokens(0, usdcStakingAmountInWei)).to.be.revertedWithCustomError(contract, "NoSuchInvestigation")

  //   const unauthorizedUser = await ethers.getImpersonatedSigner("0x0000000000000000000000000000000000000001");

  //   await expect(contract.connect(unauthorizedUser).witdrawTokens(await contract.getLastId(), usdcStakingAmountInWei)).to.be.revertedWithCustomError(contract, "NotAllowedToWithdraw")

  //   await contract.connect(stakingUser).witdrawTokens(await contract.getLastId(), usdcStakingAmountInWei);

  //   await expect(contract.connect(stakingUser).witdrawTokens(await contract.getLastId(), usdcStakingAmountInWei)).to.be.revertedWithCustomError(contract, "TokensWereWithdrawn")

  //   const updatedContractBalance = await contract.getBalanceOfContractToken(tokenName);
  //   expect(updatedContractBalance).to.equal(usdcAmountInWei);

  //   const updatedStakingData = await contract.getInvestigationById(await contract.getLastId());
  //   expect(updatedStakingData.endDate).to.not.equal(0);
  // });

  // it("client should withdraw money with no reward", async function() {
  //   const { ethUser, contract } = await loadFixture(deploy);

  //   const tokenName = "USDC";
  //   const tokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  //   await contract.connect(ethUser).addNewToken(tokenAddress, tokenName);

  //   const availableToken = await contract.connect(ethUser).getAvailableToken(tokenName);
  //   expect(availableToken).to.equal(tokenAddress);

  //   const token = IERC20__factory.connect(tokenAddress, ethUser);

  //   const usdcAmount = "100"; // 100 USDC
  //   const usdcDecimals = 6; 
  //   const usdcAmountInWei = ethers.parseUnits(usdcAmount, usdcDecimals);

  //   await token.connect(ethUser).approve(contract.getAddress(), usdcAmountInWei);

  //   const allowance = await token.allowance(ethUser.getAddress(), contract.getAddress());
  //   expect(allowance).to.equal(usdcAmountInWei);

  //   await contract.connect(ethUser).addTokensAmountForStakingReward(tokenName, usdcAmountInWei);

  //   const contractBalance = await contract.getBalanceOfContractToken(tokenName);
  //   expect(contractBalance).to.equal(usdcAmountInWei);

  //   const stakingUser = await ethers.getImpersonatedSigner("0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503");

  //   const usdcStakingAmount = "20"; // 20 USDC
  //   const usdcStakingAmountInWei = ethers.parseUnits(usdcStakingAmount, usdcDecimals);

  //   await token.connect(stakingUser).approve(contract.getAddress(), usdcStakingAmountInWei);

  //   const stakingAllowance = await token.allowance(stakingUser.getAddress(), contract.getAddress());
  //   expect(stakingAllowance).to.equal(usdcStakingAmountInWei);

  //   await contract.connect(stakingUser).addNewStakingAmount(tokenName, usdcStakingAmountInWei);

  //   expect(await contract.getBalanceOfContractToken(tokenName)).to.equal(usdcStakingAmountInWei + usdcAmountInWei);

  //   const blockNumBefore = await ethers.provider.getBlockNumber();
  //   const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  //   const timestampBefore = blockBefore?.timestamp;

  //   const stakingData = await contract.getInvestigationById(await contract.getLastId());
  //   expect(stakingData.user).to.equal(await stakingUser.getAddress());
  //   expect(stakingData.tokenName).to.equal(tokenName);
  //   expect(stakingData.amount).to.equal(usdcStakingAmountInWei);
  //   expect(stakingData.startDate).to.equal(timestampBefore);
  //   expect(stakingData.endDate).to.equal(0);

  //   await expect(contract.connect(stakingUser).witdrawTokens(0, usdcStakingAmountInWei)).to.be.revertedWithCustomError(contract, "NoSuchInvestigation")

  //   const unauthorizedUser = await ethers.getImpersonatedSigner("0x0000000000000000000000000000000000000001");

  //   await expect(contract.connect(unauthorizedUser).witdrawTokens(await contract.getLastId(), usdcStakingAmountInWei)).to.be.revertedWithCustomError(contract, "NotAllowedToWithdraw")

  //   const newTimestamp = Math.floor(Date.now() / 1000);
  //   await setBlockTime(newTimestamp)

  //   await contract.connect(stakingUser).witdrawTokens(await contract.getLastId(), usdcStakingAmountInWei);

  //   // await expect(contract.connect(stakingUser).witdrawTokens(await contract.getLastId(), usdcStakingAmountInWei)).to.be.revertedWithCustomError(contract, "TokensWereWithdrawn")

  //   // const updatedContractBalance = await contract.getBalanceOfContractToken(tokenName);
  //   // expect(updatedContractBalance).to.equal(usdcAmountInWei);

  //   // const updatedStakingData = await contract.getInvestigationById(await contract.getLastId());
  //   // expect(updatedStakingData.endDate).to.not.equal(0);
  // });

  // async function setBlockTime(newTimestamp: number) {
  //   await network.provider.send('evm_setNextBlockTimestamp', [newTimestamp]);
  //   await network.provider.send('evm_mine');
  // }

});