import {useContext} from "react";

import {InvestingContext} from "contexts/Investing";

const useInvesting = () => {
  return {...useContext(InvestingContext)};
};

export default useInvesting;
