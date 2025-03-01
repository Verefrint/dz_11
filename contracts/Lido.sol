// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILido {
    function submit(address referral) external payable returns (uint256);
}

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract LidoStaking {
    ILido public lido;
    
    mapping(address => uint256) public stakedETH;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address _lidoAddress) {
        lido = ILido(_lidoAddress);
    }

    function stakeETH() external payable {
        require(msg.value > 0, "Must send ETH to stake");

        uint256 stETHAmount = lido.submit{value: msg.value}(address(0));
        stakedETH[msg.sender] += stETHAmount;

        emit Staked(msg.sender, msg.value);
    }

    function withdrawETH(uint256 amount) external {
        require(stakedETH[msg.sender] >= amount, "Not enough staked");

        stakedETH[msg.sender] -= amount;

        emit Withdrawn(msg.sender, amount);
    }
}
