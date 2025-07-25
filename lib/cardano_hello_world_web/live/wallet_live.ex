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
      |> assign(:tx_status, nil)

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

  # Switch to a different wallet
  @impl true
  def handle_event("switch_wallet", _, socket) do
    {:noreply,
     socket
     |> assign(:wallet_status, :disconnected)
     |> assign(:connected_wallet, nil)
     |> assign(:network_id, nil)
     |> assign(:wallet_error, nil)
     |> assign(:tx_status, nil)}
  end

  # Disconnect current wallet
  @impl true
  def handle_event("disconnect_wallet", _, socket) do
    {:noreply,
     socket
     |> assign(:wallet_status, :disconnected)
     |> assign(:connected_wallet, nil)
     |> assign(:network_id, nil)
     |> assign(:wallet_error, nil)
     |> assign(:tx_status, nil)
     |> push_event("disconnect_wallet", %{})}
  end

  # Send transaction to self
  @impl true
  def handle_event("send_to_self", _params, socket) do
    IO.inspect("send to self")

    {:noreply, push_event(socket, "send_to_self", %{})}
  end

  # Transaction submitted successfully
  @impl true
  def handle_event("tx_submitted", %{"txHash" => hash}, socket) do
    {:noreply, assign(socket, :tx_status, {:submitted, hash})}
  end

  # Transaction error
  @impl true
  def handle_event("tx_error", %{"error" => err}, socket) do
    {:noreply, assign(socket, :tx_status, {:error, err})}
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
