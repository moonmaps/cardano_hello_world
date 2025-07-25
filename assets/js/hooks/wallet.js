// assets/js/hooks/wallet.js

/*
 * JAVASCRIPT BUILD CONFIGURATION ISSUES & SOLUTIONS
 * ==================================================
 * 
 * PROBLEM 1: lucid-cardano Module Compatibility
 * ----------------------------------------------
 * The lucid-cardano library imports Node.js built-in modules (fs, node:http, etc.) 
 * which don't exist in browser environments. This caused build errors like:
 * - "Could not resolve 'fs'"
 * - "Could not resolve 'node:http'"
 * 
 * PROBLEM 2: Top-level Await Support
 * -----------------------------------
 * lucid-cardano uses top-level await statements, but esbuild's default "iife" 
 * output format doesn't support this modern JavaScript feature.
 * Error: "Top-level await is currently not supported with the 'iife' output format"
 * 
 * PROBLEM 3: BigInt Literals
 * ---------------------------
 * The original es2017 target didn't support BigInt literals (2_000_000n syntax)
 * Error: "Big integer literals are not available in the configured target environment"
 * 
 * SOLUTIONS APPLIED:
 * ==================
 * 
 * 1. Updated esbuild config in config/config.exs:
 *    - Changed target: es2017 → es2022 (supports BigInt, top-level await)
 *    - Added format: esm (ES modules support top-level await)
 *    - Note: We may need --platform=browser with Node.js polyfills in the future
 * 
 * 2. Updated HTML script tag in root.html.heex:
 *    - Changed type="text/javascript" → type="module" (enables ES modules)
 * 
 * 3. Fixed BigInt syntax in code:
 *    - Changed 2_000_000n → BigInt(2_000_000) for broader compatibility
 * 
 * REMAINING CONSIDERATIONS:
 * =========================
 * - lucid-cardano may need Node.js polyfills for full browser compatibility
 * - Consider using a browser-specific Cardano library if issues persist
 * - Blockfrost provider might work better than wallet-only provider for transactions
 */

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
      console.log("🚀 send_to_self event received!");
      try {
        console.log("📋 Checking wallet connection...");
        if (!this.api) {
          console.error("❌ Wallet not connected");
          throw "Wallet not connected";
        }
        console.log("✅ Wallet API available:", this.api);

        console.log("🔧 Initializing Lucid...");
        if (!lucid) {
          console.log("🌟 Creating new Lucid instance...");
          await initLucid(this.api);
          console.log("✅ Lucid initialized:", lucid);
        }

        console.log("📍 Getting wallet address...");
        const addr = await lucid.wallet.address();
        console.log("🏠 Wallet address:", addr);

        console.log("💰 Building transaction...");
        const tx = await lucid
          .newTx()
          .payToAddress(addr, { lovelace: BigInt(2_000_000) }) // 2 ADA (1 ADA min + fee buffer)
          .complete();
        console.log("📝 Transaction built:", tx);

        console.log("✍️ Signing transaction...");
        const signedTx = await tx.sign().complete();
        console.log("🔒 Transaction signed:", signedTx);

        console.log("📤 Submitting transaction...");
        const txHash = await signedTx.submit();
        console.log("🎉 Transaction submitted! Hash:", txHash);

        this.pushEvent("tx_submitted", { txHash });
      } catch (err) {
        console.error("💥 Transaction error:", err);
        this.pushEvent("tx_error", { error: String(err) });
      }
    });
  }
};

export default WalletHook; 