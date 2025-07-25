defmodule CardanoHelloWorldWeb.WalletLive do
  use CardanoHelloWorldWeb, :live_view

  @impl true
  def mount(_, _, socket) do
    socket =
      socket
      |> assign(:wallets, [])
      |> assign(:wallet_status, :disconnected)
      |> assign(:wallet_error, nil)
      |> assign(:connected_wallet, nil)
      |> assign(:network_id, nil)

    {:ok, socket}
  end

  # Hook -> LV: list detected wallets
  @impl true
  def handle_event("wallets_available", %{"wallets" => wallets}, socket) do
    {:noreply, assign(socket, :wallets, wallets)}
  end

  # Button click -> ask hook to connect
  @impl true
  def handle_event("connect_wallet", %{"wallet" => wallet}, socket) do
    {:noreply, push_event(socket, "connect_wallet", %{wallet: wallet})}
  end

  # Hook -> LV: result of connect
  @impl true
  def handle_event(
        "wallet_connected",
        %{"ok" => true, "wallet" => wallet, "networkId" => net},
        socket
      ) do
    {:noreply,
     socket
     |> assign(:wallet_status, :connected)
     |> assign(:connected_wallet, wallet)
     |> assign(:network_id, net)
     |> assign(:wallet_error, nil)}
  end

  def handle_event("wallet_connected", %{"ok" => false, "error" => reason}, socket) do
    {:noreply,
     socket
     |> assign(:wallet_status, :error)
     |> assign(:wallet_error, reason)}
  end
end
