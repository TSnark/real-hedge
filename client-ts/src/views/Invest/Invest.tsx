import Page from "components/Page";
import PageHeader from "components/PageHeader";
import React from "react";
import {Container} from "react-neu";
import InvestCard from "./components/Invest";

const Invest: React.FC = () => {
  return (
    <Page>
      <PageHeader
        icon="💰"
        subtitle="Invest DAI and earn returns"
        title="Invest"
      />
      <Container>
        <InvestCard />
      </Container>
    </Page>
  );
};

export default Invest;
