import Page from "components/Page";
import PageHeader from "components/PageHeader";
import Split from "components/Split";
import useHedging from "hooks/useHedging";
import React, {useCallback, useState} from "react";
import {Container, Spacer} from "react-neu";
import {calculatePremium} from "rh-sdk/lib/lib/PremiumHelper";
import HedgeCard from "./components/HedgeCard";
import HedgeWarning from "./components/HedgeWarning";
import QuoteCard from "./components/QuoteCard";
import {HedgeData} from "./types";

const FIXED_MIN_LOSS_IN_BPS: number = 2500;

const Hedge: React.FC = () => {
  const {
    isGettingQuote,
    onGettingQuote,
    handleGetAllPolicies,
    isApproved,
    isApproving,
    onApprove,
  } = useHedging();
  const [hedgeData, setHedgeData] = useState<HedgeData>({});
  const handleSelectHedgeData = useCallback(
    (value) => {
      setHedgeData(value);
    },
    [setHedgeData]
  );

  return (
    <Page>
      <PageHeader
        icon="🛡️"
        subtitle="Buy a hedge and protect your property value"
        title="Hedge"
      />
      <Container>
        <HedgeWarning />
        <Spacer />
        <Split>
          <HedgeCard
            onChange={(v: HedgeData) => {
              v.minLossInBps = FIXED_MIN_LOSS_IN_BPS;
              handleSelectHedgeData(v);
            }}
            value={hedgeData}
          />
          <QuoteCard
            isBuying={isGettingQuote}
            onBuy={() => {
              handleGetAllPolicies();
              onGettingQuote(hedgeData);
            }}
            onApprove={onApprove}
            isApproved={isApproved}
            isApproving={isApproving}
            premium={calculatePremium(
              hedgeData.durationInMonths,
              hedgeData.minLossInBps,
              hedgeData.amount
            )}
          />
        </Split>
      </Container>
    </Page>
  );
};

export default Hedge;
