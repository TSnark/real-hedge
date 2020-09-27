import Page from "components/Page";
import PageHeader from "components/PageHeader";
import useHedging from "hooks/useHedging";
import React, {useEffect, useMemo} from "react";
import {Col, Container as Grid, Row} from "react-grid-system";
import {Container, Spacer} from "react-neu";
import {useWallet} from "use-wallet";
import PolicyCard from "./components/PolicyCard";

const Policies: React.FC = () => {
  const {status} = useWallet();
  const {allPolicies, handleGetAllPolicies, isClaiming, onClaim} = useHedging();

  useEffect(() => {
    if (status === "connected") {
      handleGetAllPolicies();
    }
  }, [handleGetAllPolicies, status]);

  const PoliciesCards = useMemo(() => {
    if (status === "connected") {
      return (
        <Row>
          {allPolicies?.map((policy) => (
            <Col xs={12} md={6} lg={4}>
              <PolicyCard
                policy={policy}
                onClaim={onClaim}
                isClaiming={isClaiming}
              />
              <Spacer />
            </Col>
          ))}
        </Row>
      );
    }
  }, [allPolicies, status, isClaiming, onClaim]);

  return (
    <Page>
      <PageHeader icon="🏘️" subtitle="Your policies" title="Policies" />
      <Container size="lg">
        <Grid fluid>{PoliciesCards}</Grid>
      </Container>
    </Page>
  );
};

export default Policies;
