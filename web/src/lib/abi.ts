export const receiptsAbi = [
  {
    type: "function",
    name: "pay",
    stateMutability: "nonpayable",
    inputs: [
      { name: "invoiceId", type: "bytes32" },
      { name: "payee", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "contentHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "record",
    stateMutability: "nonpayable",
    inputs: [
      { name: "invoiceId", type: "bytes32" },
      { name: "payer", type: "address" },
      { name: "payee", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "contentHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "receipts",
    stateMutability: "view",
    inputs: [{ name: "invoiceId", type: "bytes32" }],
    outputs: [
      { name: "payer", type: "address" },
      { name: "payee", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "contentHash", type: "bytes32" },
      { name: "paidAt", type: "uint64" },
    ],
  },
  {
    type: "function",
    name: "paid",
    stateMutability: "view",
    inputs: [{ name: "invoiceId", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "event",
    name: "Paid",
    inputs: [
      { name: "invoiceId", type: "bytes32", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "payee", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "contentHash", type: "bytes32", indexed: false },
    ],
  },
] as const;

export const usdcAbi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;
