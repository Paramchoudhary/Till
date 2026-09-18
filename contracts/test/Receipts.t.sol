// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {Receipts} from "../src/Receipts.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract ReceiptsTest is Test {
    Receipts internal receipts;
    MockUSDC internal usdc;
    address internal recorder = makeAddr("recorder");
    address internal payer = makeAddr("payer");
    address internal payee = makeAddr("payee");

    bytes32 internal constant INVOICE = keccak256("demo");
    bytes32 internal constant HASH = keccak256("memo");
    uint256 internal constant AMOUNT = 50_000; // 0.05 USDC

    function setUp() public {
        usdc = new MockUSDC();
        receipts = new Receipts(address(usdc), recorder);
        usdc.mint(payer, 1_000_000);
        vm.prank(payer);
        usdc.approve(address(receipts), type(uint256).max);
    }

    function test_payRecordsOnceAndMovesUsdc() public {
        vm.prank(payer);
        receipts.pay(INVOICE, payee, AMOUNT, HASH);

        (address gotPayer, address gotPayee, uint256 amount, bytes32 contentHash, uint64 paidAt) =
            receipts.receipts(INVOICE);
        assertEq(gotPayer, payer);
        assertEq(gotPayee, payee);
        assertEq(amount, AMOUNT);
        assertEq(contentHash, HASH);
        assertGt(paidAt, 0);
        assertEq(usdc.balanceOf(payee), AMOUNT);
        assertEq(usdc.balanceOf(payer), 1_000_000 - AMOUNT);
        assertTrue(receipts.paid(INVOICE));
    }

    function test_payRevertsIfTaken() public {
        vm.prank(payer);
        receipts.pay(INVOICE, payee, AMOUNT, HASH);
        vm.prank(payer);
        vm.expectRevert(Receipts.Taken.selector);
        receipts.pay(INVOICE, payee, AMOUNT, HASH);
    }

    function test_recordOnlyRecorder() public {
        vm.prank(payer);
        vm.expectRevert(Receipts.OnlyRecorder.selector);
        receipts.record(INVOICE, payer, payee, AMOUNT, HASH);

        vm.prank(recorder);
        receipts.record(INVOICE, payer, payee, AMOUNT, HASH);
        assertTrue(receipts.paid(INVOICE));
        // x402 already moved USDC; record does not pull again.
        assertEq(usdc.balanceOf(payee), 0);
    }

    function test_zeroAmountReverts() public {
        vm.prank(payer);
        vm.expectRevert(Receipts.ZeroAmount.selector);
        receipts.pay(INVOICE, payee, 0, HASH);
    }

    function test_zeroPayeeReverts() public {
        vm.prank(payer);
        vm.expectRevert(Receipts.ZeroAddress.selector);
        receipts.pay(INVOICE, address(0), AMOUNT, HASH);
    }

    function test_constructorRejectsZero() public {
        vm.expectRevert(Receipts.ZeroAddress.selector);
        new Receipts(address(0), recorder);
        vm.expectRevert(Receipts.ZeroAddress.selector);
        new Receipts(address(usdc), address(0));
    }

    function testFuzz_payMovesExactAmount(uint96 amount) public {
        vm.assume(amount > 0);
        address other = makeAddr("otherPayer");
        usdc.mint(other, amount);
        vm.startPrank(other);
        usdc.approve(address(receipts), amount);
        receipts.pay(keccak256(abi.encode(amount)), payee, amount, HASH);
        vm.stopPrank();
        assertEq(usdc.balanceOf(payee), amount);
    }
}
