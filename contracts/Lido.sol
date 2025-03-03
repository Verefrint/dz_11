// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ILido {
    function submit(address referral) external payable returns (uint256);
}

error WithdrawAmountToken();

contract LidoStaking {
    using SafeERC20 for IERC20;

    event Staked(address indexed user, uint256 ethAmount, uint256 stETHReceived);
    event Withdrawn(address indexed user, uint256 stETHAmount);

    IERC20 public immutable stETH;
    ILido public immutable lido;

    mapping(address => uint256) public stakedStETH;

    constructor(address _lidoAddress, address _stETHAddress) {
        lido = ILido(_lidoAddress);
        stETH = IERC20(_stETHAddress);
    }

    function stakeETH() external payable {
        uint256 stETHAmount = lido.submit{value: msg.value}(address(0));
        stakedStETH[msg.sender] += stETHAmount;

        emit Staked(msg.sender, msg.value, stETHAmount);
    }

    function withdrawETH(uint256 amount) external {
        require(stakedStETH[msg.sender] >= amount && amount > 0, "Insufficient stETH balance");

        stakedStETH[msg.sender] -= amount;
        stETH.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }
}
