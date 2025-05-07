// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

/**
 * @title ProductTrackerProxy
 * @dev Proxy contract for the ProductTracker, using OpenZeppelin's TransparentUpgradeableProxy
 */
contract ProductTrackerProxy is TransparentUpgradeableProxy {
    /**
     * @dev Initializes the proxy with the implementation and admin addresses.
     * @param _logic The address of the initial implementation.
     * @param _admin The address of the proxy admin.
     * @param _data The calldata to use to initialize the proxy.
     */
    constructor(
        address _logic,
        address _admin,
        bytes memory _data
    ) TransparentUpgradeableProxy(_logic, _admin, _data) {}
} 