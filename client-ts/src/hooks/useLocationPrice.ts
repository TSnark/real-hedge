import useAxios from "axios-hooks";
import moment from "moment";
import {get} from "lodash";

const useLocationPrice = (location: string) => {
  const mostRecentDateForPrice = moment()
    .subtract(3, "month")
    .format("YYYY-MM");
  const [{data, loading, error}] = useAxios(
    `https://landregistry.data.gov.uk/data/ukhpi/region/${location.toLowerCase()}/month/${mostRecentDateForPrice}.json`
  );
  if (!loading && !error) {
    return {
      price: get(data, "result.primaryTopic.averagePrice"),
      loading,
      error,
    };
  }
  return {price: data, loading, error};
};

export default useLocationPrice;
