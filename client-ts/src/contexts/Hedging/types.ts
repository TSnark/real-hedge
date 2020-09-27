export interface ContextValues {
  isGettingQuote?: boolean;
  onGettingQuote: (data: any) => void;
  onClaim: (policyId: number) => void;
  handleGetAllPolicies: () => void;
  allPolicies?: any[];
  isClaiming?: boolean;
  isApproved?: boolean;
  isApproving?: boolean;
  onApprove: () => void;
}
