import {createContext} from "react";

import {ContextValues} from "./types";

const Context = createContext<ContextValues>({
  onApprove: () => {},
  onGettingQuote: (data: any) => {},
  handleGetAllPolicies: () => {},
  onClaim: (policyId: number) => {},
});

export default Context;
