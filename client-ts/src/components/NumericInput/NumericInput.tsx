import React, {FormEvent} from "react";
import styled from "styled-components";

import {Button, Input} from "react-neu";

interface NumericInputProps {
  max: number;
  value?: number;
  symbol: string;
  onSelectMax?: () => void;
  onChange: (e?: number) => void;
  placeholder?: string;
}

const NumericInput: React.FC<NumericInputProps> = ({
  symbol,
  onChange,
  onSelectMax,
  value,
  max,
  placeholder,
}) => {
  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const newValue = Number(e.currentTarget.value);
    newValue < 0 || isNaN(newValue) || newValue > max
      ? onChange(value)
      : onChange(newValue);
  };

  return (
    <StyledNumericInput>
      <Input
        endAdornment={
          <StyledHedgeAmountAdornmentWrapper>
            <StyledHedgeAmountSymbol>{symbol}</StyledHedgeAmountSymbol>
            <StyledSpacer />
            <div>
              <Button
                onClick={onSelectMax}
                size="sm"
                text="Max"
                variant="secondary"
              />
            </div>
          </StyledHedgeAmountAdornmentWrapper>
        }
        onChange={handleChange}
        placeholder={placeholder}
        value={value ? value.toString() : ""}
      />
    </StyledNumericInput>
  );
};

const StyledNumericInput = styled.div`
  // margin-bottom: ${(props) => props.theme.spacing[3]}px;
  width: 100%;
`;

const StyledSpacer = styled.div`
  width: ${(props) => props.theme.spacing[3]}px;
`;

const StyledHedgeAmountAdornmentWrapper = styled.div`
  align-items: center;
  display: flex;
`;

const StyledHedgeAmountSymbol = styled.span`
  color: ${(props) => props.theme.colors.grey[600]};
  font-weight: 700;
`;

export default NumericInput;
