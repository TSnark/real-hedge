import React, {useCallback, useState} from "react";

import {useWallet} from "use-wallet";

import ConfirmTransactionModal from "components/ConfirmTransactionModal";
import ConfirmPolicyModal from "components/ConfirmPolicyModal";
import useRealHedge from "hooks/useRealHedge";

import {buyPolicy, claim, getAllPolicies, waitForPolicy} from "rh-sdk/utils";
import {dai} from "constants/tokenAddresses";

import Context from "./Context";
import useApproval from "hooks/useApproval";

const Provider: React.FC = ({children}) => {
  const [confirmTxModalIsOpen, setConfirmTxModalIsOpen] = useState(false);
  const [confirmPolicyModalIsOpen, setConfirmPolicyModalIsOpen] = useState(
    false
  );
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [allPolicies, setAllPolicies] = useState<any[]>([]);

  const realHedge = useRealHedge();
  const {account} = useWallet();

  const {isApproved, isApproving, onApprove} = useApproval(
    dai,
    realHedge ? realHedge.contracts.underwriter.options.address : undefined,
    () => setConfirmTxModalIsOpen(false)
  );

  const handleApprove = useCallback(() => {
    setConfirmTxModalIsOpen(true);
    onApprove();
  }, [onApprove, setConfirmTxModalIsOpen]);

  const handleGetQuote = useCallback(
    async (data: any) => {
      if (!realHedge) return;
      try {
        setConfirmTxModalIsOpen(true);
        setIsGettingQuote(true);
        await buyPolicy(realHedge, account, data, (value: any) => {
          setConfirmTxModalIsOpen(false);
          setIsGettingQuote(false);
          if (value) {
            setConfirmPolicyModalIsOpen(true);
            waitForPolicy(realHedge, account, () => {
              setConfirmPolicyModalIsOpen(false);
            });
          }
        });
      } finally {
        setConfirmTxModalIsOpen(false);
        setIsGettingQuote(false);
      }
    },
    [account, setConfirmTxModalIsOpen, setIsGettingQuote, realHedge]
  );

  const handleClaim = useCallback(
    async (policyId: number) => {
      if (!realHedge) return;
      try {
        setConfirmTxModalIsOpen(true);
        setIsClaiming(true);
        await claim(realHedge, account, policyId, (value: any) => {
          setConfirmTxModalIsOpen(false);
          setIsClaiming(false);
        });
      } finally {
        setConfirmTxModalIsOpen(false);
        setIsClaiming(false);
      }
    },
    [account, setConfirmTxModalIsOpen, setIsClaiming, realHedge]
  );

  const handleGetAllPolicies = useCallback(async () => {
    if (!realHedge) return;
    const returnedPolicies = await getAllPolicies(realHedge, account);
    setAllPolicies(returnedPolicies);
  }, [account, realHedge]);

  return (
    <Context.Provider
      value={{
        isGettingQuote,
        onGettingQuote: handleGetQuote,
        handleGetAllPolicies,
        allPolicies,
        isApproved,
        isApproving,
        isClaiming,
        onClaim: handleClaim,
        onApprove: handleApprove,
      }}
    >
      {children}
      <ConfirmTransactionModal isOpen={confirmTxModalIsOpen} />
      <ConfirmPolicyModal isOpen={confirmPolicyModalIsOpen} />
    </Context.Provider>
  );
};

export default Provider;
