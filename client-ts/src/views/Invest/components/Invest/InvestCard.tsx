import Label from "components/Label";
import Split from "components/Split";
import Value from "components/Value";
import useInvesting from "hooks/useInvesting";
import numeral from "numeral";
import React, {useCallback, useMemo, useState} from "react";
import {Box, Button, Card, CardActions, CardContent, CardIcon} from "react-neu";
import {useWallet} from "use-wallet";
import {bnToDec} from "utils";
import DepositModal from "./components/DepositModal";
import WithdrawModal from "./components/WithdrawModal";

const InvestCard: React.FC = () => {
  const [depositModalIsOpen, setDepositModalIsOpen] = useState(false);
  const [withdrawModalIsOpen, setWithdrawModalIsOpen] = useState(false);

  const {status} = useWallet();
  const {
    isApproved,
    isApproving,
    isDepositing,
    isWithdrawing,
    onApprove,
    onDeposit,
    onWithdraw,
    shares,
    value,
  } = useInvesting();

  const handleDismissDepositModal = useCallback(() => {
    setDepositModalIsOpen(false);
  }, [setDepositModalIsOpen]);

  const handleDismissWithdrawModal = useCallback(() => {
    setWithdrawModalIsOpen(false);
  }, [setWithdrawModalIsOpen]);

  const handleOnDeposit = useCallback(
    (amount: string) => {
      onDeposit(amount);
      handleDismissDepositModal();
    },
    [handleDismissDepositModal, onDeposit]
  );

  const handleOnWithdraw = useCallback(
    (amount: string) => {
      onWithdraw(amount);
      handleDismissWithdrawModal();
    },
    [handleDismissWithdrawModal, onWithdraw]
  );

  const handleDepositClick = useCallback(() => {
    setDepositModalIsOpen(true);
  }, [setDepositModalIsOpen]);

  const handleWithdrawClick = useCallback(() => {
    setWithdrawModalIsOpen(true);
  }, [setWithdrawModalIsOpen]);

  const DepositButton = useMemo(() => {
    if (status !== "connected") {
      return <Button disabled full text="Deposit" variant="secondary" />;
    }
    if (isDepositing) {
      return <Button disabled full text="Depositing..." variant="secondary" />;
    }
    if (!isApproved) {
      return (
        <Button
          disabled={isApproving}
          full
          onClick={onApprove}
          text={!isApproving ? "Approve deposit" : "Approving deposit..."}
          variant={
            isApproving || status !== "connected" ? "secondary" : "default"
          }
        />
      );
    }

    if (isApproved) {
      return <Button full onClick={handleDepositClick} text="Deposit" />;
    }
  }, [
    handleDepositClick,
    isApproving,
    onApprove,
    status,
    isApproved,
    isDepositing,
  ]);

  const WithdrawButton = useMemo(() => {
    const hasDeposit = shares && shares.toNumber() > 0;
    if (status !== "connected" || !hasDeposit) {
      return <Button disabled full text="Withdraw" variant="secondary" />;
    }
    if (isWithdrawing) {
      return <Button disabled full text="Withdrawing..." variant="secondary" />;
    }
    return (
      <Button
        full
        onClick={handleWithdrawClick}
        text="Withdraw"
        variant="secondary"
      />
    );
  }, [handleWithdrawClick, status, isWithdrawing, shares]);

  const formattedDepositBalance = useMemo(() => {
    if (!shares || shares.isZero()) {
      return "--";
    } else {
      return numeral(bnToDec(shares)).format("0.00a");
    }
  }, [shares]);

  const formattedValueBalance = useMemo(() => {
    if (!value || value.isZero()) {
      return "--";
    } else {
      return numeral(bnToDec(value)).format("0.00a");
    }
  }, [value]);

  return (
    <>
      <Card>
        <CardIcon>🏦</CardIcon>
        <CardContent>
          <Split>
            <Box alignItems="center" column>
              <Value value={formattedDepositBalance} />
              <Label text="rDAI Balance" />
            </Box>
            <Box alignItems="center" column>
              <Value value={formattedValueBalance} />
              <Label text="Value in DAI" />
            </Box>
          </Split>
        </CardContent>
        <CardActions>
          {WithdrawButton}
          {DepositButton}
        </CardActions>
      </Card>
      <DepositModal
        isOpen={depositModalIsOpen}
        onDismiss={handleDismissDepositModal}
        onDeposit={handleOnDeposit}
      />
      <WithdrawModal
        isOpen={withdrawModalIsOpen}
        onDismiss={handleDismissWithdrawModal}
        onWithdraw={handleOnWithdraw}
      />
    </>
  );
};

export default InvestCard;
