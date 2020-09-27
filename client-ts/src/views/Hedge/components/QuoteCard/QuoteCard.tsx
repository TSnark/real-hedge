import Label from "components/Label";
import Value from "components/Value";
import React, {useMemo} from "react";
import {Box, Button, Card, CardActions, CardContent, CardIcon} from "react-neu";
import {useWallet} from "use-wallet";

interface QuoteCardProps {
  premium: number;
  isBuying?: boolean;
  onBuy: () => void;
  isApproved?: boolean;
  isApproving?: boolean;
  onApprove: () => void;
}

const QuoteCard: React.FC<QuoteCardProps> = ({
  premium,
  isBuying,
  onBuy,
  isApproved,
  isApproving,
  onApprove,
}) => {
  const {status} = useWallet();

  const BuyButton = useMemo(() => {
    if (status !== "connected") {
      return <Button disabled full text="Buy" variant="secondary" />;
    }
    if (isBuying) {
      return <Button disabled full text="Buying..." variant="secondary" />;
    }
    if (isApproved) {
      return <Button full onClick={onBuy} text="Buy" />;
    }

    return (
      <Button
        disabled={isApproving || status !== "connected"}
        full
        onClick={onApprove}
        text={!isApproving ? "Approve Underwriter" : "Approving Underwriter..."}
        variant={
          isApproving || status !== "connected" ? "secondary" : "default"
        }
      />
    );
  }, [onBuy, isBuying, status, isApproving, onApprove, isApproved]);

  const formattedStakedBalance = useMemo(() => {
    if (premium) {
      return premium.toString();
    } else {
      return "--";
    }
  }, [premium]);

  return (
    <>
      <Card>
        <CardIcon>💲</CardIcon>
        <CardContent>
          <Box alignItems="center" column>
            <Value value={formattedStakedBalance} />
            <Label text="Policy Premium To Pay" />
          </Box>
        </CardContent>
        <CardActions>{BuyButton}</CardActions>
      </Card>
    </>
  );
};

export default QuoteCard;
