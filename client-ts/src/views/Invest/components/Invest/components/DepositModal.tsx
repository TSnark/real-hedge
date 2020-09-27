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
import useBalances from "hooks/useBalances";
import {getFullDisplayBalance} from "utils";

interface DepositModalProps extends ModalProps {
  onDeposit: (amount: string) => void;
}

const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onDismiss,
  onDeposit,
}) => {
  const [val, setVal] = useState("");
  const {daiBalance} = useBalances();

  const fullBalance = useMemo(() => {
    return getFullDisplayBalance(daiBalance || new BigNumber(0), 0);
  }, [daiBalance]);

  const handleChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      setVal(e.currentTarget.value);
    },
    [setVal]
  );

  const handleSelectMax = useCallback(() => {
    setVal(fullBalance);
  }, [fullBalance, setVal]);

  const handleDepositClick = useCallback(() => {
    onDeposit(val);
  }, [onDeposit, val]);

  return (
    <Modal isOpen={isOpen}>
      <ModalTitle text="Deposit" />
      <ModalContent>
        <TokenInput
          value={val}
          onSelectMax={handleSelectMax}
          onChange={handleChange}
          max={fullBalance}
          symbol="DAI"
        />
      </ModalContent>
      <ModalActions>
        <Button onClick={onDismiss} text="Cancel" variant="secondary" />
        <Button
          disabled={!val || !Number(val)}
          onClick={handleDepositClick}
          text="Deposit"
          variant={!val || !Number(val) ? "secondary" : "default"}
        />
      </ModalActions>
    </Modal>
  );
};

export default DepositModal;
