import { createConfig, fallback, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { arc, arcTestnet, chainIdFromEnv } from "./chains";

const active = chainIdFromEnv() === 5042002 ? arcTestnet : arc;
const other = active.id === arc.id ? arcTestnet : arc;

export const wagmiConfig = createConfig({
  chains: [active, other],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [arc.id]: fallback(arc.rpcUrls.default.http.map((url) => http(url))),
    [arcTestnet.id]: fallback(arcTestnet.rpcUrls.default.http.map((url) => http(url))),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
