import React, {useCallback, useMemo, useState} from "react";

import BigNumber from "bignumber.js";
import {
  Button,
  Modal,
  ModalActions,
  ModalContent,
  ModalProps,
  ModalTitle,
} from "react-neu";

import TokenInput from "components/TokenInput";

import {getFullDisplayBalance} from "utils";
import useInvesting from "hooks/useInvesting";

interface WithdrawModalProps extends ModalProps {
  onWithdraw: (amount: string) => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onDismiss,
  onWithdraw,
}) => {
  const [val, setVal] = useState("");
  const {shares} = useInvesting();

  const fullBalance = useMemo(() => {
    return getFullDisplayBalance(shares || new BigNumber(0));
  }, [shares]);

  const handleChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      setVal(e.currentTarget.value);
    },
    [setVal]
  );

  const handleSelectMax = useCallback(() => {
    setVal(fullBalance);
  }, [fullBalance, setVal]);

  const handleWithdrawClick = useCallback(() => {
    onWithdraw(val);
  }, [onWithdraw, val]);

  return (
    <Modal isOpen={isOpen}>
      <ModalTitle text="Withdraw" />
      <ModalContent>
        <TokenInput
          value={val}
          onSelectMax={handleSelectMax}
          onChange={handleChange}
          max={fullBalance}
          symbol="rDAI"
        />
      </ModalContent>
      <ModalActions>
        <Button onClick={onDismiss} text="Cancel" variant="secondary" />
        <Button
          disabled={!val || !Number(val)}
          onClick={handleWithdrawClick}
          text="Withdraw"
          variant={!val || !Number(val) ? "secondary" : "default"}
        />
      </ModalActions>
    </Modal>
  );
};

export default WithdrawModal;
