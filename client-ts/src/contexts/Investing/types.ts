import BigNumber from "bignumber.js";

export interface ContextValues {
  value?: BigNumber;
  isApproved?: boolean;
  isApproving?: boolean;
  isDepositing?: boolean;
  isWithdrawing?: boolean;
  onApprove: () => void;
  onDeposit: (amount: string) => void;
  onWithdraw: (amount: string) => void;
  shares?: BigNumber;
}
