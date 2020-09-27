import BigNumber from "bignumber.js";
import Label from "components/Label";
import Value from "components/Value";
import useLocationPrice from "hooks/useLocationPrice";
import numeral from "numeral";
import React, {useMemo} from "react";
import {FormattedDate} from "react-intl";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardTitle,
} from "react-neu";
import {useWallet} from "use-wallet";
import {bnToDec} from "utils";

interface Policy {
  policyId: number;
  coverAmount: BigNumber;
  end: number;
  strikePrice: number;
  externalCode: string;
}
interface PolicyProps {
  policy: Policy;
  isClaiming?: boolean;
  onClaim: (policyId: number) => void;
}
const PolicyCard: React.FC<PolicyProps> = ({policy, isClaiming, onClaim}) => {
  const {price, loading, error} = useLocationPrice(policy.externalCode);
  const {status} = useWallet();

  const LocationPrice = useMemo(() => {
    return (
      <>
        <Box alignItems="center" row>
          <Label text="Current Price" />
        </Box>
        <Box alignItems="center" row>
          <Value value={!loading || !error ? "£" + price : "--"} />
        </Box>
      </>
    );
  }, [price, loading, error]);

  const ClaimButton = useMemo(() => {
    if (status !== "connected") {
      return <Button disabled full text="Claim" variant="secondary" />;
    }
    if (isClaiming) {
      return <Button full disabled text="Claiming ..." />;
    }
    return (
      <Button
        full
        disabled={price < policy.strikePrice}
        onClick={() => onClaim(policy.policyId)}
        text="Claim"
      />
    );
  }, [status, isClaiming, onClaim, policy.policyId, price, policy.strikePrice]);

  const TransferButton = useMemo(() => {
    return <Button disabled full text="Transfer" variant="secondary" />;
  }, []);

  const formattedAmount = useMemo(() => {
    if (!policy.coverAmount || policy.coverAmount.isZero()) {
      return "--";
    } else {
      return `${numeral(bnToDec(policy.coverAmount)).format("0.00a")} DAI`;
    }
  }, [policy.coverAmount]);

  return (
    <>
      <Card>
        <CardTitle text={policy.externalCode} />
        <CardContent>
          <Box alignItems="center" column>
            <Box alignItems="center" row>
              <Label text="Cover" />
            </Box>
            <Box alignItems="center" row>
              <Value value={formattedAmount} />
            </Box>
            <Box alignItems="center" row>
              <Label text="Strike Price" />
            </Box>
            <Box alignItems="center" row>
              <Value value={"£" + policy.strikePrice.toString()} />
            </Box>
            {LocationPrice}
            <Box alignItems="center" row>
              <Label text="Expiration" />
            </Box>
            <Box alignItems="center" row>
              <FormattedDate value={new Date(policy.end * 1000)} />
            </Box>
          </Box>
        </CardContent>
        <CardActions>
          {ClaimButton}
          {TransferButton}
        </CardActions>
      </Card>
    </>
  );
};

export default PolicyCard;
