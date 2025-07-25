// assets/js/hooks/wallet.js
import { Lucid, walletFromCip30 } from "lucid-cardano";

let lucid;

async function initLucid(api) {
  lucid = await Lucid.new(
    // You can swap this out for Blockfrost, Koios, etc. later.
    // For pure wallet-only usage, use a dummy provider and rely on the wallet to submit.
    walletFromCip30(api),
    "Mainnet" // or "Preprod"
  );
}

const WalletHook = {
  async mounted() {
    // On mount, tell LV what wallets are available
    const wallets = [];
    if (window.cardano) {
      for (const [name, api] of Object.entries(window.cardano)) {
        if (api && typeof api.enable === "function") {
          wallets.push(name);
        }
      }
    }
    this.pushEvent("wallets_available", { wallets });

    // Listen for LV -> hook event to connect
    this.handleEvent("connect_wallet", async ({ wallet }) => {
      try {
        if (!window.cardano?.[wallet]) throw `Wallet '${wallet}' not found`;
        const api = await window.cardano[wallet].enable();
        // Store API reference for later use
        this.api = api;
        // Optionally call getNetworkId(), getUsedAddresses(), etc.
        const networkId = await api.getNetworkId();
        this.pushEvent("wallet_connected", { ok: true, wallet, networkId });
      } catch (err) {
        this.pushEvent("wallet_connected", { ok: false, error: String(err) });
      }
    });

    // Listen for LV -> hook event to disconnect
    this.handleEvent("disconnect_wallet", () => {
      // Clear any stored wallet reference
      // Note: CIP-30 doesn't have a standard disconnect method,
      // so we just clear our local state
      this.api = null;
      lucid = null;
      console.log("Wallet disconnected");
    });

    // Listen for LV -> hook event to send transaction
    this.handleEvent("send_to_self", async (_) => {
      try {
        if (!this.api) throw "Wallet not connected";
        if (!lucid) await initLucid(this.api);

        const addr = await lucid.wallet.address();

        const tx = await lucid
          .newTx()
          .payToAddress(addr, { lovelace: BigInt(2_000_000) }) // 2 ADA (1 ADA min + fee buffer)
          .complete();

        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();

        this.pushEvent("tx_submitted", { txHash });
      } catch (err) {
        this.pushEvent("tx_error", { error: String(err) });
      }
    });
  }
};

export default WalletHook; 