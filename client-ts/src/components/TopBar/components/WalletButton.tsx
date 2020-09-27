import UnlockWalletModal from "components/UnlockWalletModal";
import React, {useCallback, useState} from "react";
import {Button} from "react-neu";
import styled from "styled-components";
import {useWallet} from "use-wallet";

interface WalletButtonProps {}

const WalletButton: React.FC<WalletButtonProps> = (props) => {
  const [unlockModalIsOpen, setUnlockModalIsOpen] = useState(false);

  const {account, reset} = useWallet();

  const handleDismissUnlockModal = useCallback(() => {
    setUnlockModalIsOpen(false);
  }, [setUnlockModalIsOpen]);

  const handleUnlockWalletClick = useCallback(() => {
    setUnlockModalIsOpen(true);
  }, [setUnlockModalIsOpen]);

  const handleSignOut = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <>
      <StyledWalletButton>
        {!account ? (
          <Button
            onClick={handleUnlockWalletClick}
            size="sm"
            text="Unlock Wallet"
          />
        ) : (
          <Button onClick={handleSignOut} text="SignOut" />
        )}
      </StyledWalletButton>
      <UnlockWalletModal
        isOpen={unlockModalIsOpen}
        onDismiss={handleDismissUnlockModal}
      />
    </>
  );
};

const StyledWalletButton = styled.div``;

export default WalletButton;
