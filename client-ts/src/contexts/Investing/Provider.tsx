import React, {useCallback, useEffect, useState} from "react";

import BigNumber from "bignumber.js";
import {useWallet} from "use-wallet";

import ConfirmTransactionModal from "components/ConfirmTransactionModal";
import {dai} from "constants/tokenAddresses";
import useApproval from "hooks/useApproval";
import useRealHedge from "hooks/useRealHedge";

import {getValue, getShares, deposit, withdraw} from "rh-sdk/utils";

import Context from "./Context";

const Provider: React.FC = ({children}) => {
  const [confirmTxModalIsOpen, setConfirmTxModalIsOpen] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [value, setValue] = useState<BigNumber>();
  const [shares, setShares] = useState<BigNumber>();

  const rh = useRealHedge();
  const {account} = useWallet();

  const treasuryAddress = rh ? rh.contracts.treasury.options.address : "";
  const {isApproved, isApproving, onApprove} = useApproval(
    dai,
    treasuryAddress,
    () => setConfirmTxModalIsOpen(false)
  );

  const fetchValue = useCallback(async () => {
    if (!account || !rh) return;

    const balance = await getValue(rh, rh.contracts.rDai, account);
    setValue(balance);
  }, [account, setValue, rh]);

  const fetchShares = useCallback(async () => {
    if (!account || !rh) return;
    const balance = await getShares(rh, rh.contracts.rDai, account);
    setShares(balance);
  }, [account, setShares, rh]);

  const fetchBalances = useCallback(async () => {
    fetchValue();
    fetchShares();
  }, [fetchValue, fetchShares]);

  const handleApprove = useCallback(() => {
    setConfirmTxModalIsOpen(true);
    onApprove();
  }, [onApprove, setConfirmTxModalIsOpen]);

  const handleDeposit = useCallback(
    async (amount: string) => {
      if (!rh) return;
      try {
        setConfirmTxModalIsOpen(true);
        await deposit(rh, amount, account, () => {
          setConfirmTxModalIsOpen(false);
          setIsDepositing(true);
        });
      } finally {
        setConfirmTxModalIsOpen(false);
        setIsDepositing(false);
      }
    },
    [account, setConfirmTxModalIsOpen, setIsDepositing, rh]
  );

  const handleWithdraw = useCallback(
    async (amount: string) => {
      if (!rh) return;
      try {
        setConfirmTxModalIsOpen(true);
        await withdraw(rh, amount, account, () => {
          setConfirmTxModalIsOpen(false);
          setIsWithdrawing(true);
        });
      } finally {
        setConfirmTxModalIsOpen(false);
        setIsWithdrawing(false);
      }
    },
    [account, setConfirmTxModalIsOpen, setIsWithdrawing, rh]
  );

  useEffect(() => {
    fetchBalances();
    let refreshInterval = setInterval(() => fetchBalances(), 10000);
    return () => clearInterval(refreshInterval);
  }, [fetchBalances]);

  return (
    <Context.Provider
      value={{
        value,
        isApproved,
        isApproving,
        isDepositing,
        isWithdrawing,
        onApprove: handleApprove,
        onDeposit: handleDeposit,
        onWithdraw: handleWithdraw,
        shares,
      }}
    >
      {children}
      <ConfirmTransactionModal isOpen={confirmTxModalIsOpen} />
    </Context.Provider>
  );
};

export default Provider;
