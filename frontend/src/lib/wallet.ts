export const STUDIONET_CHAIN_ID_DEC = 61999;
export const STUDIONET_CHAIN_ID_HEX = '0xf1ef';
export const STUDIONET_RPC = 'https://studio.genlayer.com/api';

export interface WalletState {
  address: string;
  chainId: number | null;
  balance: string;
  isConnected: boolean;
  isCorrectNetwork: boolean;
}

export function isEthereumAvailable(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
}

/**
 * Checks existing wallet connection status without prompting
 */
export async function checkWalletConnection(): Promise<WalletState> {
  if (!isEthereumAvailable()) {
    return {
      address: '',
      chainId: null,
      balance: '0',
      isConnected: false,
      isCorrectNetwork: false,
    };
  }

  const ethereum = (window as any).ethereum;
  try {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      return {
        address: '',
        chainId: null,
        balance: '0',
        isConnected: false,
        isCorrectNetwork: false,
      };
    }

    const address = accounts[0];
    const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16);
    const isCorrectNetwork = chainId === STUDIONET_CHAIN_ID_DEC;

    let balance = '0';
    try {
      const balanceHex = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      balance = (Number(BigInt(balanceHex)) / 1e18).toFixed(4);
    } catch (e) {
      console.warn('Could not read wallet balance:', e);
    }

    return {
      address,
      chainId,
      balance,
      isConnected: true,
      isCorrectNetwork,
    };
  } catch (err) {
    console.error('Error checking wallet connection:', err);
    return {
      address: '',
      chainId: null,
      balance: '0',
      isConnected: false,
      isCorrectNetwork: false,
    };
  }
}

/**
 * Connects MetaMask / injected Web3 wallet
 */
export async function connectWallet(): Promise<WalletState> {
  if (!isEthereumAvailable()) {
    throw new Error('No Ethereum wallet detected. Please install MetaMask to interact with GenLayer.');
  }

  const ethereum = (window as any).ethereum;
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

  if (!accounts || accounts.length === 0) {
    throw new Error('No account authorized in wallet');
  }

  const address = accounts[0];
  const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
  const chainId = parseInt(chainIdHex, 16);

  // If wrong network, attempt automatic switch
  let isCorrectNetwork = chainId === STUDIONET_CHAIN_ID_DEC;
  if (!isCorrectNetwork) {
    try {
      await switchToStudionet();
      isCorrectNetwork = true;
    } catch (e) {
      console.warn('Network switch skipped or rejected:', e);
    }
  }

  let balance = '0';
  try {
    const balanceHex = await ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    balance = (Number(BigInt(balanceHex)) / 1e18).toFixed(4);
  } catch (e) {}

  return {
    address,
    chainId: isCorrectNetwork ? STUDIONET_CHAIN_ID_DEC : chainId,
    balance,
    isConnected: true,
    isCorrectNetwork,
  };
}

/**
 * Prompts user to switch or add GenLayer Studionet to their wallet
 */
export async function switchToStudionet(): Promise<void> {
  if (!isEthereumAvailable()) return;

  const ethereum = (window as any).ethereum;
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIONET_CHAIN_ID_HEX }],
    });
  } catch (switchError: any) {
    // Error 4902 means the chain has not been added to MetaMask yet
    if (switchError.code === 4902 || switchError?.message?.includes('Unrecognized chain')) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: STUDIONET_CHAIN_ID_HEX,
            chainName: 'GenLayer Studionet',
            rpcUrls: [STUDIONET_RPC],
            nativeCurrency: {
              name: 'GEN',
              symbol: 'GEN',
              decimals: 18,
            },
            blockExplorerUrls: ['https://studio.genlayer.com'],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}
