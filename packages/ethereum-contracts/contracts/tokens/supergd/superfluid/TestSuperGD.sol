// SPDX-License-Identifier: AGPLv3
pragma solidity >=0.8;
import "./SuperGoodDollar.sol";

contract TestSuperGD is SuperGoodDollar {
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        ISuperfluid host,
        address _fakeunderlying,
        address COF,
        address CIF
    ) SuperGoodDollar(host) {
        SuperGoodDollar.initialize(
            name,
            symbol,
            0,
            IFeesFormula(address(0)),
            IIdentity(address(0)),
            address(0),
            msg.sender,
            IConstantOutflowNFT(COF),
            IConstantInflowNFT(CIF)
        );
        _underlyingDecimals = decimals;
        _underlyingToken = IERC20(_fakeunderlying);
    }

    function upgrade(uint256 amount) external {
        _mint(
            msg.sender,
            msg.sender,
            amount,
            false /* requireReceptionAck */,
            new bytes(0),
            new bytes(0)
        );
    }

    function upgradeTo(
        address to,
        uint256 amount,
        bytes calldata data
    ) external {
        _mint(
            msg.sender,
            to,
            amount,
            false /* requireReceptionAck */,
            data,
            new bytes(0)
        );
    }

    function operationUpgrade(
        address account,
        uint256 amount
    ) external virtual onlyHost {
        _mint(
            msg.sender,
            account,
            amount,
            false /* requireReceptionAck */,
            new bytes(0),
            new bytes(0)
        );
    }

    /**
     * ERC-20 mockings
     */
    function approveInternal(
        address owner,
        address spender,
        uint256 value
    ) external {
        _approve(owner, spender, value);
    }

    function transferInternal(
        address from,
        address to,
        uint256 value
    ) external {
        _transferFrom(from, from, to, value);
    }

    /**
     * ERC-777 mockings
     */
    function setupDefaultOperators(address[] memory operators) external {
        _setupDefaultOperators(operators);
    }

    function mintInternal(
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    ) external {
        // set requireReceptionAck to true always
        _mint(msg.sender, to, amount, true, userData, operatorData);
    }

    /**
     * @notice Links the NFT contracts to the SuperToken.
     * @dev This is only to be used in testing as the NFT contracts are linked in initialize.
     * @param constantOutflowNFTAddress constant outflow nft proxy contract address
     * @param constantInflowNFTAddress constant inflow nft proxy contract address
     * @param poolAdminNFTAddress pool admin nft proxy contract address
     * @param poolMemberNFTAddress pool member nft proxy contract address
     */
    function setNFTProxyContracts(
        address constantOutflowNFTAddress,
        address constantInflowNFTAddress,
        address poolAdminNFTAddress,
        address poolMemberNFTAddress
    ) external {
        _onlyOwner();

        constantOutflowNFT = IConstantOutflowNFT(constantOutflowNFTAddress);
        constantInflowNFT = IConstantInflowNFT(constantInflowNFTAddress);
        poolAdminNFT = IPoolAdminNFT(poolAdminNFTAddress);
        poolMemberNFT = IPoolMemberNFT(poolMemberNFTAddress);
    }

    function getUnderlyingToken() external view returns (address) {
        return address(_underlyingToken);
    }
}
