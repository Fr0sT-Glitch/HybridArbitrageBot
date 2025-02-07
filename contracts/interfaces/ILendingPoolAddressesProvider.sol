// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILendingPoolAddressesProvider {
    function getLendingPool() external view returns (address);
    function setLendingPoolImpl(address pool) external;
    function getLendingPoolConfigurator() external view returns (address);
    function setLendingPoolConfiguratorImpl(address configurator) external;
    function getLendingPoolCollateralManager() external view returns (address);
    function setLendingPoolCollateralManager(address manager) external;
    function getPoolAdmin() external view returns (address);
    function setPoolAdmin(address admin) external;
    function getEmergencyAdmin() external view returns (address);
    function setEmergencyAdmin(address admin) external;
    function getPriceOracle() external view returns (address);
    function setPriceOracle(address priceOracle) external;
    function getLendingRateOracle() external view returns (address);
    function setLendingRateOracle(address lendingRateOracle) external;
}
