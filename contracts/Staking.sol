// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

error AddressIsEmpty();
error TokenNotAvailable();
error NoSuchInvestigation();
error TokensWereWithdrawn();
error NotAllowedToWithdraw();
error BadApprove();
error FailedToTransfer();

//make upgradable
contract Staking is OwnableUpgradeable {

    using SafeERC20 for IERC20;

    struct Investigation {
        address user;
        address token;
        uint amount;
        uint startDate;
        uint endDate;
    }
    
    uint private constant PRECISION = 1e18;
    uint private constant PERCENT_IN_YEAR = 10 * PRECISION / 1e2;//10% per year => 0.1
    uint private constant DAYS_IN_YEAR = 365;

    mapping(address => bool) private availableTokens;
    mapping(uint => Investigation) private usersInvestigations;

    uint private counterId = 0;

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    function getLastId() public view returns(uint) {
        return counterId;
    }

    function getAvailableToken(address _key) public view returns (bool) {
        return availableTokens[_key];
    }

    function getBalanceOfContractToken(address token) public view returns (uint) {
        return IERC20(token).balanceOf(address(this));
    }

    function getInvestigationById(uint _tokenId) external view returns(Investigation memory) {
        return usersInvestigations[_tokenId];
    }

    function addNewToken(address _token) external onlyOwner {
        require(_token != address(0), AddressIsEmpty());
        availableTokens[_token] = true;
    }

    function withdrawTokensFromContract(address tokenAddress, uint amount)  external onlyOwner {
        require(tokenAddress != address(0) && availableTokens[tokenAddress], TokenNotAvailable());

        IERC20 token = IERC20(tokenAddress);
        bool result = token.transfer(msg.sender, amount);

        require (result, FailedToTransfer());
    }

    function addTokensAmountForStakingReward(address _tokenAddress, uint _amount) external onlyOwner  {
        require(availableTokens[_tokenAddress] == true, TokenNotAvailable());

        IERC20 token = IERC20(_tokenAddress);

        if(token.allowance(msg.sender, address(this)) < _amount){
            revert("You don't have allowance for that");
        }

        if (_tokenAddress == 0xdAC17F958D2ee523a2206206994597C13D831ec7) {
            token.transferFrom(msg.sender, address(this), _amount);
        } else {
            bool result = token.transferFrom(msg.sender, address(this), _amount);
            require(result, FailedToTransfer());
        }
    }

    function addNewStakingAmount(address _tokenAddress, uint _amount) external returns(uint) {
        IERC20 token = IERC20(_tokenAddress);
        token.approve(msg.sender, _amount);
        bool result = token.transferFrom(address(this), msg.sender, _amount);

        require (result, FailedToTransfer());

        Investigation memory inv = Investigation({
            user: address(msg.sender),
            token: address(_tokenAddress),
            amount: _amount,
            startDate: block.timestamp,
            endDate: 0
        });

        counterId++;
        usersInvestigations[counterId] = inv;

        return counterId;
    }

    function witdrawTokens(uint investigationId, uint amountToWitdraw) external payable {
        Investigation memory inv = usersInvestigations[investigationId];

        require(inv.user != address(0), NoSuchInvestigation());
        require(inv.user == msg.sender, NotAllowedToWithdraw());
        require(inv.endDate == 0, TokensWereWithdrawn());

        uint result = countRefund(inv) + amountToWitdraw;
        usersInvestigations[investigationId].endDate = block.timestamp;

        IERC20 token = IERC20(inv.token);
        bool success = token.transfer(inv.user, result);

        if (!success) {
            usersInvestigations[investigationId].endDate = 0;
            revert FailedToTransfer();
        }
    
        if (amountToWitdraw < inv.amount) {
            counterId++;

            usersInvestigations[counterId] = Investigation({
                user: inv.user,
                token: inv.token,
                amount: inv.amount - amountToWitdraw,
                startDate: inv.startDate,
                endDate: 0
            });
        }
    }

    function countRefund(Investigation memory inv) private view returns(uint) {
        uint256 stakingDuration = block.timestamp - inv.startDate / 86400;
        uint result = ((stakingDuration * PERCENT_IN_YEAR * inv.amount) / (DAYS_IN_YEAR * PRECISION));
        return result;
    }

    function getRefund(uint investigationId) external payable {
        Investigation memory inv = usersInvestigations[investigationId];

        require(inv.user != address(0), NoSuchInvestigation());
        require(inv.user == msg.sender, NotAllowedToWithdraw());
        require(inv.endDate == 0, TokensWereWithdrawn());

        uint result = countRefund(inv);
        IERC20 token = IERC20(inv.token);
        bool success = token.transfer(inv.user, result);

        require(success, FailedToTransfer());
    }
}