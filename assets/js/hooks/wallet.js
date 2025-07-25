// assets/js/hooks/wallet.js
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
        // Optionally call getNetworkId(), getUsedAddresses(), etc.
        const networkId = await api.getNetworkId();
        this.pushEvent("wallet_connected", { ok: true, wallet, networkId });
      } catch (err) {
        this.pushEvent("wallet_connected", { ok: false, error: String(err) });
      }
    });
  }
};

export default WalletHook; 