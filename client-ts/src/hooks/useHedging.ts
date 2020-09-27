import {useContext} from "react";

import {HedgingContext} from "contexts/Hedging";

const useHedging = () => {
  return {...useContext(HedgingContext)};
};

export default useHedging;
