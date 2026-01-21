import { useCallback, useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { verifyMessage } from 'viem';
import type { Address } from 'viem';

/**
 * SIWE (Sign-In with Ethereum) message structure
 * RFC: https://eips.ethereum.org/EIPS/eip-4361
 */
export interface SIWEMessage {
  domain: string;
  address: Address;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

/**
 * SIWE verification result
 */
export interface SIWEVerification {
  isValid: boolean;
  message?: SIWEMessage;
  error?: string;
  signer?: Address;
}

/**
 * Generate SIWE message
 */
export const generateSIWEMessage = (
  address: Address,
  chainId: number,
  domain: string = 'bassball.game',
  statement: string = 'Sign in to Bass Ball',
  expirationHours: number = 24
): SIWEMessage => {
  const now = new Date();
  const expiration = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);

  return {
    domain,
    address,
    statement,
    uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    version: '1',
    chainId,
    nonce: generateNonce(),
    issuedAt: now.toISOString(),
    expirationTime: expiration.toISOString(),
  };
};

/**
 * Format SIWE message for signing
 */
export const formatSIWEMessage = (msg: SIWEMessage): string => {
  let message = `${msg.domain} wants you to sign in with your Ethereum account:
${msg.address}

`;

  if (msg.statement) {
    message += `${msg.statement}

`;
  }

  const fields = [
    `URI: ${msg.uri}`,
    `Version: ${msg.version}`,
    `Chain ID: ${msg.chainId}`,
    `Nonce: ${msg.nonce}`,
    `Issued At: ${msg.issuedAt}`,
  ];

  if (msg.expirationTime) {
    fields.push(`Expiration Time: ${msg.expirationTime}`);
  }

  if (msg.notBefore) {
    fields.push(`Not Before: ${msg.notBefore}`);
  }

  if (msg.requestId) {
    fields.push(`Request ID: ${msg.requestId}`);
  }

  if (msg.resources && msg.resources.length > 0) {
    fields.push(`Resources:
${msg.resources.map(r => `- ${r}`).join('\n')}`);
  }

  message += fields.join('
');
  return message;
};

/**
 * Verify SIWE message and signature
 */
export const verifySIWEMessage = async (
  message: string,
  signature: `0x${string}`,
  expectedAddress: Address,
  expectedChainId?: number
): Promise<SIWEVerification> => {
  try {
    // Verify signature
    const isValid = await verifyMessage({
      address: expectedAddress,
      message,
      signature,
    });

    if (!isValid) {
      return {
        isValid: false,
        error: 'Invalid signature',
      };
    }

    // Parse message
    const parsed = parseSIWEMessage(message);
    if (!parsed) {
      return {
        isValid: false,
        error: 'Invalid SIWE message format',
      };
    }

    // Verify address matches
    if (parsed.address.toLowerCase() !== expectedAddress.toLowerCase()) {
      return {
        isValid: false,
        error: 'Address mismatch',
      };
    }

    // Verify chain ID if provided
    if (expectedChainId && parsed.chainId !== expectedChainId) {
      return {
        isValid: false,
        error: 'Chain ID mismatch',
      };
    }

    // Check expiration
    if (parsed.expirationTime) {
      const expiration = new Date(parsed.expirationTime);
      if (new Date() > expiration) {
        return {
          isValid: false,
          error: 'Message expired',
        };
      }
    }

    // Check notBefore
    if (parsed.notBefore) {
      const notBefore = new Date(parsed.notBefore);
      if (new Date() < notBefore) {
        return {
          isValid: false,
          error: 'Message not yet valid',
        };
      }
    }

    return {
      isValid: true,
      message: parsed,
      signer: expectedAddress,
    };
  } catch (err) {
    return {
      isValid: false,
      error: err instanceof Error ? err.message : 'Verification failed',
    };
  }
};

/**
 * Parse SIWE message string
 */
export const parseSIWEMessage = (message: string): SIWEMessage | null => {
  try {
    const lines = message.split('
').map(l => l.trim()).filter(l => l);

    if (lines.length < 7) return null;

    const domain = lines[0].split(' ')[0];
    const address = lines[1] as Address;

    let statement: string | undefined;
    let currentLineIdx = 2;

    // Find the statement (lines that don't match field pattern)
    const fieldPattern = /^[A-Z][A-Za-z\s]+:/;
    while (currentLineIdx < lines.length && !fieldPattern.test(lines[currentLineIdx])) {
      statement = (statement ? statement + ' ' : '') + lines[currentLineIdx];
      currentLineIdx++;
    }

    // Parse fields
    const fields: Record<string, string> = {};
    for (let i = currentLineIdx; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(':')) {
        const [key, value] = line.split(':').map(s => s.trim());
        fields[key] = value;
      }
    }

    return {
      domain,
      address,
      statement,
      uri: fields['URI'] || '',
      version: fields['Version'] || '1',
      chainId: parseInt(fields['Chain ID'] || '1', 10),
      nonce: fields['Nonce'] || '',
      issuedAt: fields['Issued At'] || new Date().toISOString(),
      expirationTime: fields['Expiration Time'],
      notBefore: fields['Not Before'],
      requestId: fields['Request ID'],
    };
  } catch (err) {
    return null;
  }
};

/**
 * Generate random nonce
 */
export const generateNonce = (): string => {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Hook for SIWE authentication flow
 */
export const useSIWEAuth = () => {
  const { address, chainId } = useAccount();
  const { signMessageAsync, isPending } = useSignMessage();

  const [siweMessage, setSIWEMessage] = useState<SIWEMessage | null>(null);
  const [session, setSession] = useState<{
    signature: string;
    message: SIWEMessage;
    expiresAt: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load session from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('siwe:session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          setSession(parsed);
        } else {
          localStorage.removeItem('siwe:session');
        }
      }
    } catch (err) {
      console.warn('Failed to load SIWE session:', err);
    }
  }, []);

  const createMessage = useCallback(() => {
    if (!address || !chainId) {
      setError('Wallet not connected');
      return null;
    }

    const msg = generateSIWEMessage(address, chainId);
    setSIWEMessage(msg);
    return msg;
  }, [address, chainId]);

  const signIn = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!siweMessage) {
        const msg = createMessage();
        if (!msg) return false;
        setSIWEMessage(msg);
      }

      const message = formatSIWEMessage(siweMessage!);
      const signature = await signMessageAsync({ message });

      // Verify signature
      const verification = await verifySIWEMessage(
        message,
        signature as `0x${string}`,
        siweMessage!.address,
        siweMessage!.chainId
      );

      if (!verification.isValid) {
        setError(verification.error);
        return false;
      }

      // Store session
      const newSession = {
        signature,
        message: siweMessage!,
        expiresAt: new Date(siweMessage!.expirationTime || '').getTime(),
      };

      setSession(newSession);
      localStorage.setItem('siwe:session', JSON.stringify(newSession));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [siweMessage, signMessageAsync, createMessage]);

  const signOut = useCallback(() => {
    setSession(null);
    setSIWEMessage(null);
    localStorage.removeItem('siwe:session');
  }, []);

  const isAuthenticated = useCallback(() => {
    if (!session) return false;
    return session.expiresAt > Date.now();
  }, [session]);

  return {
    address,
    chainId,
    siweMessage,
    session,
    error,
    isPending,
    isLoading,
    isAuthenticated: isAuthenticated(),
    createMessage,
    signIn,
    signOut,
  };
};
