import NumericInput from "components/NumericInput";
import PostcodeInput from "components/PostcodeInput";
import React, {useCallback} from "react";
import {Box, Card, CardContent, Spacer} from "react-neu";
import {HedgeData} from "../../types";

interface HedgeCardProps {
  value: HedgeData;
  onChange: (data: HedgeData) => void;
}

const HedgeCard: React.FC<HedgeCardProps> = ({onChange, value}) => {
  const handleAmountChange = useCallback(
    (amount?: number) => {
      onChange({...value, amount});
    },
    [onChange, value]
  );

  const handleSelectMaxAmount = useCallback(() => {
    onChange({...value, amount: 50000});
  }, [onChange, value]);

  const handleDurationChange = useCallback(
    (durationInMonths?: number) => {
      onChange({...value, durationInMonths});
    },
    [onChange, value]
  );

  const handleSelectMaxDuration = useCallback(() => {
    onChange({...value, durationInMonths: 60});
  }, [onChange, value]);

  const handlePostCodeChange = useCallback(
    (location?: string) => {
      onChange({...value, location});
    },
    [onChange, value]
  );

  return (
    <Card>
      <CardContent>
        <Box alignItems="center" column>
          <Spacer size={"sm"} />
          <NumericInput
            max={50000}
            value={value.amount}
            onSelectMax={handleSelectMaxAmount}
            onChange={handleAmountChange}
            symbol="DAI"
            placeholder="Amount"
          />
          <Spacer />
          <NumericInput
            max={50000}
            value={value.durationInMonths}
            onSelectMax={handleSelectMaxDuration}
            onChange={handleDurationChange}
            symbol="Months"
            placeholder="Duration"
          />
          <Spacer />
          <PostcodeInput
            value={value.location}
            onChange={handlePostCodeChange}
          />
          <Spacer size={"sm"} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default HedgeCard;
