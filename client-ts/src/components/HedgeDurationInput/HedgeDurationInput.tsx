import React, {FormEvent} from "react";
import styled from "styled-components";

import {Button, Input} from "react-neu";

interface HedgeDurationInputProps {
  max: number;
  value?: number;
  symbol: string;
  onSelectMax?: () => void;
  onChange: (e?: number) => void;
}

const HedgeDurationInput: React.FC<HedgeDurationInputProps> = ({
  symbol,
  onChange,
  onSelectMax,
  value,
  max,
}) => {
  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const newValue = Number(e.currentTarget.value);
    newValue < 0 || isNaN(newValue) || newValue > max
      ? onChange(value)
      : onChange(newValue);
  };

  return (
    <StyledHedgeDurationInput>
      <div>
        <Button
          onClick={onSelectMax}
          size="sm"
          text="6 Month"
          variant="secondary"
        />
      </div>{" "}
      <div>
        <Button
          onClick={onSelectMax}
          size="sm"
          text="1 Year"
          variant="secondary"
        />
      </div>{" "}
      <div>
        <Button
          onClick={onSelectMax}
          size="sm"
          text="2 years"
          variant="secondary"
        />
      </div>
      {/* <div>
        <Button
          onClick={onSelectMax}
          size="sm"
          text="5 years"
          variant="secondary"
        />
      </div> */}
    </StyledHedgeDurationInput>
  );
};

const StyledHedgeDurationInput = styled.div`
  display: flex;
  margin-bottom: ${(props) => props.theme.spacing[3]}px;
`;

const StyledSpacer = styled.div`
  width: ${(props) => props.theme.spacing[3]}px;
`;

const StyledHedgeDurationAdornmentWrapper = styled.div`
  align-items: center;
  display: flex;
`;

const StyledHedgeDurationSymbol = styled.span`
  color: ${(props) => props.theme.colors.grey[600]};
  font-weight: 700;
`;

export default HedgeDurationInput;
