import React, {FormEvent} from "react";
import {Input} from "react-neu";
import styled from "styled-components";

interface PostcodeInputProps {
  value?: string;
  onChange: (e?: string) => void;
}

const PostcodeInput: React.FC<PostcodeInputProps> = ({onChange, value}) => {
  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    onChange(e.currentTarget.value);
  };
  return (
    <StyledPostcodeInput>
      <Input onChange={handleChange} placeholder="Location" value={value} />
    </StyledPostcodeInput>
  );
};

const StyledPostcodeInput = styled.div`
  width: 100%;
`;

export default PostcodeInput;
