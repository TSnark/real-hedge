import BigNumber from "bignumber.js";

export function calculatePremium(
  durationInMonths,
  strikeLossInBps,
  coverAmount
) {
  return new BigNumber(durationInMonths)
    .multipliedBy(new BigNumber(coverAmount))
    .multipliedBy(new BigNumber(11000 - strikeLossInBps))
    .div(new BigNumber(4000000))
    .integerValue()
    .toNumber();
}
