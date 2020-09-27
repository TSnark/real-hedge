import MobileMenu from "components/MobileMenu";
import TopBar from "components/TopBar";
import {currentNetworkId} from "constants/network";
import {BalancesProvider} from "contexts/Balances";
import {HedgingProvider} from "contexts/Hedging";
import {InvestingProvider} from "contexts/Investing";
import RealHedgeProvider from "contexts/RealHedgeProvider";
import useLocalStorage from "hooks/useLocalStorage";
import React, {useCallback, useMemo, useState} from "react";
import {IntlProvider} from "react-intl";
import {createTheme, ThemeProvider} from "react-neu";
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import {UseWalletProvider} from "use-wallet";
import FAQ from "views/FAQ";
import Hedge from "views/Hedge";
import Invest from "views/Invest";
import Policies from "views/Policies";

const App: React.FC = () => {
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleDismissMobileMenu = useCallback(() => {
    setMobileMenu(false);
  }, [setMobileMenu]);

  const handlePresentMobileMenu = useCallback(() => {
    setMobileMenu(true);
  }, [setMobileMenu]);

  return (
    <Router>
      <Providers>
        <TopBar onPresentMobileMenu={handlePresentMobileMenu} />
        <MobileMenu onDismiss={handleDismissMobileMenu} visible={mobileMenu} />
        <Switch>
          <Route exact path="/faq">
            <FAQ />
          </Route>
          <Route exact path="/invest">
            <Invest />
          </Route>
          <Route exact path="/">
            <Hedge />
          </Route>
          <Route exact path="/policies">
            <Policies />
          </Route>
        </Switch>
      </Providers>
    </Router>
  );
};

const Providers: React.FC = ({children}) => {
  const [darkModeSetting] = useLocalStorage("darkMode", true);
  const {dark: darkTheme, light: lightTheme} = useMemo(() => {
    return createTheme({
      baseColor: {h: 338, s: 100, l: 41},
      baseColorDark: {h: 213, s: 77, l: 24},
      borderRadius: 28,
    });
  }, []);
  return (
    <ThemeProvider
      darkModeEnabled={darkModeSetting}
      darkTheme={darkTheme}
      lightTheme={lightTheme}
    >
      <UseWalletProvider
        chainId={parseInt(currentNetworkId)}
        connectors={{
          walletconnect: {rpcUrl: "https://mainnet.eth.aragon.network/"},
        }}
      >
        <IntlProvider locale={navigator.language}>
          <RealHedgeProvider>
            <BalancesProvider>
              <InvestingProvider>
                <HedgingProvider>{children}</HedgingProvider>
              </InvestingProvider>
            </BalancesProvider>
          </RealHedgeProvider>
        </IntlProvider>
      </UseWalletProvider>
    </ThemeProvider>
  );
};

export default App;
