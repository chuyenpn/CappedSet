import Wallet from "ethereumjs-wallet";

export function randomAddress(): string {
    return Wallet.generate().getChecksumAddressString();
}

export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}