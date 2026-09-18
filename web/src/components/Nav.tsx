import Link from "next/link";
import { WalletButton } from "./WalletButton";

export function Nav() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
      <Link href="/" className="font-semibold tracking-tight">
        Till
      </Link>
      <nav className="flex items-center gap-4 text-sm text-muted">
        <Link href="/new" className="hover:text-foreground">
          New invoice
        </Link>
        <Link href="/i/demo" className="hover:text-foreground">
          Demo
        </Link>
        <WalletButton />
      </nav>
    </header>
  );
}
