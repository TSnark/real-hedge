import React, {createContext, useEffect, useState} from "react";

import {useWallet} from "use-wallet";
import {currentNetworkId} from "constants/network";
import {RealHedge} from "rh-sdk/lib";

export interface RHContext {
  realHedge?: any;
}

export const Context = createContext<RHContext>({
  realHedge: undefined,
});

declare global {
  interface Window {
    rhsauce: any;
  }
}

const RHProvider: React.FC = ({children}) => {
  const {ethereum} = useWallet();
  const [realHedge, setRealHedge] = useState<any>();

  useEffect(() => {
    if (ethereum) {
      const rhLib = new RealHedge(ethereum, currentNetworkId, false, {
        defaultAccount: "",
        defaultConfirmations: 1,
        autoGasMultiplier: 1.5,
        testing: false,
        defaultGas: "6000000",
        defaultGasPrice: "1000000000000",
        accounts: [],
        ethereumNodeTimeout: 10000,
      });

      setRealHedge(rhLib);
      window.rhsauce = rhLib;
    }
  }, [ethereum]);

  return (
    <Context.Provider value={{realHedge: realHedge}}>
      {children}
    </Context.Provider>
  );
};

export default RHProvider;
