import {useContext} from "react";
import {Context} from "../contexts/RealHedgeProvider";

const useRealHedge = () => {
  const {realHedge} = useContext(Context);
  return realHedge;
};

export default useRealHedge;
