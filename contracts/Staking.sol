// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

error AddressIsEmpty();
error TokenNotAvailable();
error NoSuchInvestigation();
error TokensWereWithdrawn();
error NotAllowedToWithdraw();
error FailedToTransfer();

//make upgradable
contract Staking is OwnableUpgradeable {

    struct Investigation {
        address user;
        string tokenName;
        uint amount;
        uint startDate;
        uint endDate;
    }

    event NewTokenAdditing (
        uint timestamp,
        string tokenName
    );
    
    uint private constant PERCENT_IN_DAY = 273 * 1e7;//10% per year

    mapping(string => address) private availableTokens;
    mapping(string => uint) private balancesOfContractTokens;
    mapping(uint => Investigation) private usersInvestigations;

    uint private counterId = 0;

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    function getLastId() public view returns(uint) {
        return counterId;
    }

    function getAvailableToken(string memory key) public view returns (address) {
        return availableTokens[key];
    }

    function getBalanceOfContractToken(string memory key) public view returns (uint) {
        return balancesOfContractTokens[key];
    }

    function getInvestigationById(uint _tokenId) external view returns(Investigation memory) {
        return usersInvestigations[_tokenId];
    }

    function addNewToken(address _token, string memory _tokenName) external onlyOwner {
        require(_token != address(0), AddressIsEmpty());
        availableTokens[_tokenName] = _token;

        emit NewTokenAdditing(block.timestamp, _tokenName);
    }

    function withdrawTokensFromContract(string memory tokenName, uint amount)  external onlyOwner returns(bool) {
        require(availableTokens[tokenName] != address(0), TokenNotAvailable());

        IERC20 token = IERC20(availableTokens[tokenName]);

        token.approve(address(this), amount);

        bool result = token.transferFrom(address(this), msg.sender, amount);

        balancesOfContractTokens[tokenName] = balancesOfContractTokens[tokenName] - amount;

        return result;
    }

    function addTokensAmountForStakingReward(string memory tokenName, uint amount) external onlyOwner returns(bool) {
        require(availableTokens[tokenName] != address(0), TokenNotAvailable());

        IERC20 token = IERC20(availableTokens[tokenName]);

        token.approve(msg.sender, amount);

        bool result = token.transferFrom(msg.sender, address(this), amount);

        balancesOfContractTokens[tokenName] = balancesOfContractTokens[tokenName] + amount;

        return result;
    }

    function addNewStakingAmount(string memory _tokenName, uint _amount) external returns(uint) {
        IERC20 token = IERC20(availableTokens[_tokenName]);

        counterId = counterId + 1;

        token.transferFrom(msg.sender, address(this), _amount);

        balancesOfContractTokens[_tokenName] = balancesOfContractTokens[_tokenName] + _amount;

        Investigation memory inv = Investigation({
            user: address(msg.sender),
            tokenName: _tokenName,
            amount: _amount,
            startDate: block.timestamp,
            endDate: 0
        });

        usersInvestigations[counterId] = inv;

        return counterId;
    }

    function witdrawTokens(uint investigationId, uint amountToWitdraw) external payable {
        require(usersInvestigations[investigationId].user != address(0), NoSuchInvestigation());

        Investigation memory inv = usersInvestigations[investigationId];

        require(inv.user == msg.sender, NotAllowedToWithdraw());

        require(inv.endDate == 0, TokensWereWithdrawn());

        uint daysStaked = (block.timestamp - inv.startDate) / 86400;

        uint256 result = ((PERCENT_IN_DAY * daysStaked * amountToWitdraw) / 1e7) + amountToWitdraw;

        IERC20 token = IERC20(availableTokens[inv.tokenName]);

        bool success = token.transfer(inv.user, result);
        require(success, FailedToTransfer());

        balancesOfContractTokens[inv.tokenName] = balancesOfContractTokens[inv.tokenName] - result;

        usersInvestigations[investigationId] = Investigation({
            user: inv.user,
            tokenName: inv.tokenName,
            amount: inv.amount,
            startDate: inv.startDate,
            endDate: block.timestamp
        });

        if (amountToWitdraw < inv.amount) {

            counterId = counterId + 1;

            usersInvestigations[counterId] = Investigation({
                user: inv.user,
                tokenName: inv.tokenName,
                amount: inv.amount - amountToWitdraw,
                startDate: inv.startDate,
                endDate: block.timestamp
            });
        }
    }
}