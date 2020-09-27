import React from "react";
import {Modal, ModalContent, ModalProps, Spacer} from "react-neu";
import styled from "styled-components";

const ConfirmTransactionModal: React.FC<ModalProps> = ({isOpen}) => {
  return (
    <Modal isOpen={isOpen}>
      <ModalContent>
        <Spacer />
        <StyledText>Waiting For Policy</StyledText>
        <Spacer />
      </ModalContent>
    </Modal>
  );
};

const StyledText = styled.div`
  font-size: 24px;
  text-align: center;
`;

export default ConfirmTransactionModal;
