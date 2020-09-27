import React from "react";
import {Button, Notice, NoticeContent, NoticeIcon, Spacer} from "react-neu";
import styled from "styled-components";

const HedgeWarning: React.FC = () => (
  <Notice>
    <NoticeIcon>⚠️</NoticeIcon>
    <NoticeContent>
      <StyledNoticeContentInner>
        <span>
          U.K. locations only. Minimum loss covered at the moment is -25%
        </span>
        <Spacer size="sm" />
        <Button size="sm" text="Learn more" to="/faq" variant="tertiary" />
      </StyledNoticeContentInner>
    </NoticeContent>
  </Notice>
);

const StyledNoticeContentInner = styled.div`
  align-items: center;
  display: flex;
  @media (max-width: 768px) {
    flex-flow: column nowrap;
    align-items: flex-start;
  }
`;

export default HedgeWarning;
