import BigNumber from "bignumber.js";
import {dai} from "constants/tokenAddresses";
import React, {useCallback, useEffect, useState} from "react";
import {useWallet} from "use-wallet";
import {getBalance} from "utils";
import {provider} from "web3-core";
import Context from "./Context";

const Provider: React.FC = ({children}) => {
  const [daiBalance, setDaiBalance] = useState<BigNumber>();

  const {
    account,
    ethereum,
  }: {account: string | null; ethereum: provider} = useWallet();

  const fetchBalances = useCallback(
    async (userAddress: string, provider: provider) => {
      const balances = await Promise.all([
        await getBalance(provider, dai, userAddress),
      ]);
      setDaiBalance(
        new BigNumber(balances[3]).dividedBy(new BigNumber(10).pow(18))
      );
    },
    [setDaiBalance]
  );

  useEffect(() => {
    if (account && ethereum) {
      fetchBalances(account, ethereum);
    }
  }, [account, ethereum, fetchBalances]);

  useEffect(() => {
    if (account && ethereum) {
      fetchBalances(account, ethereum);
      let refreshInterval = setInterval(
        () => fetchBalances(account, ethereum),
        10000
      );
      return () => clearInterval(refreshInterval);
    }
  }, [account, ethereum, fetchBalances]);

  return (
    <Context.Provider
      value={{
        daiBalance,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default Provider;
