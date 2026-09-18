import { decodeInvoice, encodeInvoice, formatUsdc, invoiceId, parseInvoice } from "./invoice";
import { describe, expect, it } from "vitest";

describe("invoice encoding", () => {
  const invoice = parseInvoice({
    v: 1,
    payee: "0x054b1d7859CFFb53284a1461Dde9179Df7CF182f",
    amount: "50000",
    memo: "Logo",
    salt: "abc",
  });

  it("round-trips through a URL-safe id", () => {
    const id = encodeInvoice(invoice);
    expect(id).not.toMatch(/[+/=]/);
    const back = decodeInvoice(id);
    expect(back).toEqual(invoice);
    expect(back.payee).toBe("0x054b1d7859cffb53284a1461dde9179df7cf182f");
  });

  it("keeps a stable invoice id", () => {
    expect(invoiceId(invoice)).toBe(invoiceId(decodeInvoice(encodeInvoice(invoice))));
  });

  it("formats USDC without trailing zeros", () => {
    expect(formatUsdc("50000")).toBe("0.05");
    expect(formatUsdc("1000000")).toBe("1");
    expect(formatUsdc("1500000")).toBe("1.5");
  });

  it("rejects a zero amount", () => {
    expect(() =>
      parseInvoice({ v: 1, payee: invoice.payee, amount: "0", memo: "x", salt: "s" }),
    ).toThrow(/positive integer/);
  });
});
