import { useState, useEffect } from "react";
import { formatBalance, formatChainAsNum } from "./utils";
import detectEthereumProvider from "@metamask/detect-provider";

import "./App.css";

function App() {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const initialState = { accounts: [], balance: "", chainId: "" };
  const [wallet, setWallet] = useState(initialState);

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const refreshAccounts = (accounts: any) => {
      if (accounts.length > 0) {
        updateWallet(accounts);
      } else {
        setWallet(initialState);
      }
    };

    const refreshChain = (chainId: any) => {
      setWallet((wallet) => ({ ...wallet, chainId }));
    };

    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true });
      setHasProvider(Boolean(provider));

      if (provider) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        refreshAccounts(accounts);
        window.ethereum.on("accountsChanged", refreshAccounts);
        window.ethereum.on("chainChanged", refreshChain);
      }
    };

    getProvider();

    return () => {
      window.ethereum?.removeListener("accountsChanged", refreshAccounts);
      window.ethereum?.removeListener("chainChanged", refreshChain);
    };
  }, []);

  const updateWallet = async (accounts: any) => {
    const balance = formatBalance(
      await window.ethereum!.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      })
    );
    const chainId = await window.ethereum!.request({
      method: "eth_chainId",
    });
    console.log({ balance });
    setWallet({ accounts, balance, chainId });
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    await window.ethereum
      .request({
        method: "eth_requestAccounts",
      })
      .then((accounts: []) => {
        setError(false);
        updateWallet(accounts);
      })
      .catch((err: any) => {
        setError(true);
        setErrorMessage(err.message);
      });
    setIsConnecting(false);
  };

  const disableConnect = Boolean(wallet) && isConnecting;

  return (
    <div className="App">
      {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && (
        <button disabled={disableConnect} onClick={handleConnect}>
          Connect MetaMask
        </button>
      )}

      {wallet.accounts.length > 0 && (
        <p>
          <span>Wallet Accounts: {wallet.accounts[0]}</span>
          <br />
          <span>Wallet Balance: {wallet.balance}</span>
          <br />
          <span>Hex ChainId: {wallet.chainId}</span>
          <br />
          <span>Numeric ChainId: {formatChainAsNum(wallet.chainId)}</span>
          <br />
        </p>
      )}
      {error && (
        <p onClick={() => setError(false)}>
          <strong>Error:</strong> {errorMessage}
        </p>
      )}
    </div>
  );
}

export default App;
