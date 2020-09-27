import {createContext} from "react";

import {ContextValues} from "./types";

const Context = createContext<ContextValues>({
  onApprove: () => {},
  onDeposit: () => {},
  onWithdraw: () => {},
});

export default Context;
