// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title Receipts
/// @notice One immutable commercial receipt per invoice. Humans pay through `pay`, which
///         pulls USDC. Agents pay through HTTP 402; the recorder then calls `record`.
///         Amounts and the recorder address are frozen at construction. There is no withdraw.
contract Receipts {
    address public immutable USDC;
    address public immutable recorder;

    struct Receipt {
        address payer;
        address payee;
        uint256 amount;
        bytes32 contentHash;
        uint64 paidAt;
    }

    mapping(bytes32 invoiceId => Receipt) public receipts;

    event Paid(
        bytes32 indexed invoiceId, address indexed payer, address indexed payee, uint256 amount, bytes32 contentHash
    );

    error Taken();
    error ZeroAmount();
    error ZeroAddress();
    error OnlyRecorder();
    error TransferFailed();

    constructor(address usdc, address recorder_) {
        if (usdc == address(0) || recorder_ == address(0)) revert ZeroAddress();
        USDC = usdc;
        recorder = recorder_;
    }

    /// @notice Pay an invoice from the caller's USDC balance and write the receipt.
    function pay(bytes32 invoiceId, address payee, uint256 amount, bytes32 contentHash) external {
        _store(invoiceId, msg.sender, payee, amount, contentHash);
        if (!IERC20(USDC).transferFrom(msg.sender, payee, amount)) revert TransferFailed();
    }

    /// @notice Record a receipt after Circle's x402 facilitator has already moved USDC.
    function record(bytes32 invoiceId, address payer, address payee, uint256 amount, bytes32 contentHash) external {
        if (msg.sender != recorder) revert OnlyRecorder();
        _store(invoiceId, payer, payee, amount, contentHash);
    }

    function paid(bytes32 invoiceId) external view returns (bool) {
        return receipts[invoiceId].paidAt != 0;
    }

    function _store(bytes32 invoiceId, address payer, address payee, uint256 amount, bytes32 contentHash) internal {
        if (amount == 0) revert ZeroAmount();
        if (payer == address(0) || payee == address(0)) revert ZeroAddress();
        if (receipts[invoiceId].paidAt != 0) revert Taken();
        receipts[invoiceId] = Receipt({
            payer: payer, payee: payee, amount: amount, contentHash: contentHash, paidAt: uint64(block.timestamp)
        });
        emit Paid(invoiceId, payer, payee, amount, contentHash);
    }
}
