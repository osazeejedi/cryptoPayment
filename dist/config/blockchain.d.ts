import Web3 from 'web3';
declare const web3: Web3<import("web3-eth").RegisteredSubscription>;
declare const companyWallet: {
    address: string | undefined;
    privateKey: string | undefined;
};
export { web3, companyWallet };
