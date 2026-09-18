// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {Receipts} from "../src/Receipts.sol";

/// @notice Deploys Receipts to Arc. Gas is USDC.
///
///   forge script script/Deploy.s.sol:Deploy --rpc-url arc_testnet --broadcast
///   forge script script/Deploy.s.sol:Deploy --rpc-url arc --broadcast
contract Deploy is Script {
    address constant USDC = 0x3600000000000000000000000000000000000000;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address recorder = vm.envOr("TILL_RECORDER", deployer);
        require(block.chainid == 5042 || block.chainid == 5042002, "not Arc");
        require(USDC.code.length > 0, "no USDC predeploy");

        vm.startBroadcast(pk);
        Receipts receipts = new Receipts(USDC, recorder);
        vm.stopBroadcast();

        console2.log("Receipts", address(receipts));
        console2.log("recorder", recorder);
        console2.log("chainid", block.chainid);
    }
}
