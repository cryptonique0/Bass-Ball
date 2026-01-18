/**
 * Email to Wallet Provider
 * Creates ERC-4337 smart contract wallets from email addresses on Base network
 */

interface EmailVerificationToken {
  tokenId: string;
  email: string;
  token: string;
  expiresAt: number;
  verified: boolean;
  verifiedAt?: number;
  attempts: number;
  maxAttempts: number;
}

interface SmartWalletAccount {
  accountId: string;
  email: string;
  walletAddress: string;
  
  // ERC-4337 Account Setup
  entryPointAddress: string;
  factoryAddress: string;
  salt: string; // deterministic salt from email hash
  
  // Account State
  isDeployed: boolean;
  deploymentTx?: string;
  deployedAt?: number;
  
  createdAt: number;
  lastActivity: number;
  
  // Recovery
  recoveryEmail: string;
  recoveryPhrase?: string; // encrypted
  backupCodes: string[]; // encrypted backup codes
  
  // Security
  verified: boolean;
  twoFactorEnabled: boolean;
  authenticatorKey?: string;
  
  // Account Metadata
  displayName?: string;
  avatar?: string;
  tier: 'free' | 'premium' | 'elite';
}

interface AccountRecoveryRequest {
  recoveryId: string;
  email: string;
  walletAddress?: string;
  recoveryMethod: 'email_link' | 'backup_code' | 'authenticator';
  recoveryToken: string;
  expiresAt: number;
  used: boolean;
  usedAt?: number;
  createdAt: number;
}

interface WalletInitData {
  walletAddress: string;
  email: string;
  salt: string;
  factoryAddress: string;
  entryPointAddress: string;
  initialCode: string; // initCode for wallet creation
  nonce: number;
  chainId: number; // Base: 8453
}

interface SessionToken {
  sessionId: string;
  email: string;
  walletAddress: string;
  token: string;
  expiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
  createdAt: number;
  lastUsed: number;
  ipAddress?: string;
  userAgent?: string;
}

interface OnboardingProgress {
  progressId: string;
  email: string;
  walletAddress?: string;
  
  step: 'email_entry' | 'email_verification' | 'wallet_creation' | 'wallet_deployment' | 'profile_setup' | 'completed';
  completedSteps: string[];
  
  emailVerified: boolean;
  walletCreated: boolean;
  walletDeployed: boolean;
  profileSetup: boolean;
  
  startedAt: number;
  completedAt?: number;
  lastActivity: number;
}

interface EmailTemplate {
  templateId: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
  createdAt: number;
}

export class EmailToWalletProvider {
  private static instance: EmailToWalletProvider;
  
  private emailVerifications: Map<string, EmailVerificationToken> = new Map();
  private smartWallets: Map<string, SmartWalletAccount> = new Map(); // Key: email
  private walletsByAddress: Map<string, SmartWalletAccount> = new Map(); // Key: wallet address
  private recoveryRequests: Map<string, AccountRecoveryRequest> = new Map();
  private sessionTokens: Map<string, SessionToken> = new Map();
  private onboardingProgress: Map<string, OnboardingProgress> = new Map();
  private emailTemplates: Map<string, EmailTemplate> = new Map();

  // Configuration
  private readonly FACTORY_ADDRESS = '0x9406cc6185a346906296840746c16faeba0659d7'; // SimpleAccountFactory on Base
  private readonly ENTRY_POINT = '0x0000000071727de22e5e9d8baf0edac6f37da032'; // EntryPoint v0.6 on Base
  private readonly CHAIN_ID = 8453; // Base network
  private readonly SALT_PREFIX = 'bass_ball_'; // Domain-specific salt prefix

  // Email config
  private readonly VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly SESSION_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly RECOVERY_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_VERIFICATION_ATTEMPTS = 5;

  private constructor() {
    this.loadFromStorage();
    this.initializeEmailTemplates();
  }

  static getInstance(): EmailToWalletProvider {
    if (!EmailToWalletProvider.instance) {
      EmailToWalletProvider.instance = new EmailToWalletProvider();
    }
    return EmailToWalletProvider.instance;
  }

  /**
   * Email Verification Flow
   */
  requestEmailVerification(email: string): EmailVerificationToken {
    const existing = this.emailVerifications.get(email);
    
    // Check for existing unverified token
    if (existing && !existing.verified && existing.expiresAt > Date.now()) {
      if (existing.attempts < existing.maxAttempts) {
        existing.attempts++;
        this.saveToStorage();
        return existing;
      } else {
        // Too many attempts, create new token
        this.emailVerifications.delete(email);
      }
    }

    const token = this.generateVerificationToken(32);
    const verification: EmailVerificationToken = {
      tokenId: `verify_${email}_${Date.now()}`,
      email,
      token,
      expiresAt: Date.now() + this.VERIFICATION_TOKEN_EXPIRY,
      verified: false,
      attempts: 1,
      maxAttempts: this.MAX_VERIFICATION_ATTEMPTS,
    };

    this.emailVerifications.set(email, verification);
    this.saveToStorage();

    // In production, send email with verification link
    console.log(`[EMAIL] Verification token for ${email}: ${token}`);
    
    return verification;
  }

  verifyEmail(email: string, token: string): boolean {
    const verification = this.emailVerifications.get(email);
    
    if (!verification) {
      return false;
    }

    if (verification.expiresAt < Date.now()) {
      this.emailVerifications.delete(email);
      return false;
    }

    if (verification.token !== token) {
      verification.attempts++;
      if (verification.attempts >= verification.maxAttempts) {
        this.emailVerifications.delete(email);
      }
      this.saveToStorage();
      return false;
    }

    verification.verified = true;
    verification.verifiedAt = Date.now();
    this.saveToStorage();
    
    return true;
  }

  getVerificationStatus(email: string): { verified: boolean; expiresAt: number } | null {
    const verification = this.emailVerifications.get(email);
    if (!verification) return null;

    return {
      verified: verification.verified,
      expiresAt: verification.expiresAt,
    };
  }

  /**
   * Smart Wallet Creation
   */
  createSmartWallet(email: string): SmartWalletAccount {
    // Verify email is verified
    const verification = this.emailVerifications.get(email);
    if (!verification || !verification.verified) {
      throw new Error('Email must be verified before creating wallet');
    }

    // Check if wallet already exists for this email
    if (this.smartWallets.has(email)) {
      throw new Error('Wallet already exists for this email');
    }

    // Generate deterministic salt from email
    const salt = this.generateDeterministicSalt(email);

    // Derive wallet address (simplified - in production use proper factory call)
    const walletAddress = this.deriveWalletAddress(email, salt);

    const account: SmartWalletAccount = {
      accountId: `account_${email}_${Date.now()}`,
      email,
      walletAddress,
      entryPointAddress: this.ENTRY_POINT,
      factoryAddress: this.FACTORY_ADDRESS,
      salt,
      isDeployed: false,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      recoveryEmail: email,
      backupCodes: this.generateBackupCodes(10),
      verified: true,
      twoFactorEnabled: false,
      tier: 'free',
    };

    this.smartWallets.set(email, account);
    this.walletsByAddress.set(walletAddress.toLowerCase(), account);

    // Create onboarding progress
    this.createOnboardingProgress(email, walletAddress);

    this.saveToStorage();
    return account;
  }

  getSmartWallet(email: string): SmartWalletAccount | null {
    return this.smartWallets.get(email) || null;
  }

  getSmartWalletByAddress(walletAddress: string): SmartWalletAccount | null {
    return this.walletsByAddress.get(walletAddress.toLowerCase()) || null;
  }

  /**
   * Wallet Initialization (ERC-4337)
   */
  getWalletInitData(email: string): WalletInitData | null {
    const account = this.smartWallets.get(email);
    if (!account) return null;

    // Generate initCode for wallet factory
    const initCode = this.encodeFactoryInitCode(account);

    return {
      walletAddress: account.walletAddress,
      email,
      salt: account.salt,
      factoryAddress: account.factoryAddress,
      entryPointAddress: account.entryPointAddress,
      initialCode: initCode,
      nonce: 0,
      chainId: this.CHAIN_ID,
    };
  }

  deployWallet(email: string, deploymentTx: string): SmartWalletAccount | null {
    const account = this.smartWallets.get(email);
    if (!account) return null;

    account.isDeployed = true;
    account.deploymentTx = deploymentTx;
    account.deployedAt = Date.now();
    account.lastActivity = Date.now();

    this.saveToStorage();
    return account;
  }

  /**
   * Session Management
   */
  createSessionToken(email: string, ipAddress?: string, userAgent?: string): SessionToken {
    const account = this.smartWallets.get(email);
    if (!account) {
      throw new Error('No wallet found for this email');
    }

    const token = this.generateToken(64);
    const refreshToken = this.generateToken(64);

    const session: SessionToken = {
      sessionId: `session_${email}_${Date.now()}`,
      email,
      walletAddress: account.walletAddress,
      token,
      expiresAt: Date.now() + this.SESSION_TOKEN_EXPIRY,
      refreshToken,
      refreshTokenExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      createdAt: Date.now(),
      lastUsed: Date.now(),
      ipAddress,
      userAgent,
    };

    this.sessionTokens.set(token, session);
    this.saveToStorage();

    return session;
  }

  validateSessionToken(token: string): SessionToken | null {
    const session = this.sessionTokens.get(token);
    
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      this.sessionTokens.delete(token);
      this.saveToStorage();
      return null;
    }

    session.lastUsed = Date.now();
    this.saveToStorage();
    return session;
  }

  refreshSessionToken(refreshToken: string): SessionToken | null {
    const sessions = Array.from(this.sessionTokens.values());
    const session = sessions.find(s => s.refreshToken === refreshToken);

    if (!session) return null;
    if (session.refreshTokenExpiresAt < Date.now()) {
      this.sessionTokens.delete(session.token);
      this.saveToStorage();
      return null;
    }

    // Create new session
    const newToken = this.generateToken(64);
    const newSession: SessionToken = {
      ...session,
      token: newToken,
      expiresAt: Date.now() + this.SESSION_TOKEN_EXPIRY,
      refreshToken: this.generateToken(64),
      refreshTokenExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    this.sessionTokens.delete(session.token);
    this.sessionTokens.set(newToken, newSession);
    this.saveToStorage();

    return newSession;
  }

  getAllSessions(email: string): SessionToken[] {
    return Array.from(this.sessionTokens.values()).filter(
      s => s.email === email && s.expiresAt > Date.now()
    );
  }

  revokeSession(token: string): boolean {
    return this.sessionTokens.delete(token);
  }

  /**
   * Account Recovery
   */
  requestAccountRecovery(email: string): AccountRecoveryRequest {
    const account = this.smartWallets.get(email);
    if (!account) {
      throw new Error('No account found for this email');
    }

    const recoveryToken = this.generateToken(48);
    const recovery: AccountRecoveryRequest = {
      recoveryId: `recovery_${email}_${Date.now()}`,
      email,
      walletAddress: account.walletAddress,
      recoveryMethod: 'email_link',
      recoveryToken,
      expiresAt: Date.now() + this.RECOVERY_TOKEN_EXPIRY,
      used: false,
      createdAt: Date.now(),
    };

    this.recoveryRequests.set(recoveryToken, recovery);
    this.saveToStorage();

    // Send recovery email
    console.log(`[EMAIL] Recovery link for ${email}: ${recoveryToken}`);

    return recovery;
  }

  completeAccountRecovery(recoveryToken: string): SmartWalletAccount | null {
    const recovery = this.recoveryRequests.get(recoveryToken);
    
    if (!recovery) return null;
    if (recovery.expiresAt < Date.now()) {
      this.recoveryRequests.delete(recoveryToken);
      return null;
    }
    if (recovery.used) {
      return null;
    }

    recovery.used = true;
    recovery.usedAt = Date.now();

    const account = this.smartWallets.get(recovery.email);
    if (account) {
      account.lastActivity = Date.now();
    }

    this.saveToStorage();
    return account || null;
  }

  /**
   * Onboarding Progress
   */
  private createOnboardingProgress(email: string, walletAddress: string): OnboardingProgress {
    const progress: OnboardingProgress = {
      progressId: `progress_${email}_${Date.now()}`,
      email,
      walletAddress,
      step: 'wallet_creation',
      completedSteps: ['email_entry', 'email_verification', 'wallet_creation'],
      emailVerified: true,
      walletCreated: true,
      walletDeployed: false,
      profileSetup: false,
      startedAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.onboardingProgress.set(email, progress);
    return progress;
  }

  getOnboardingProgress(email: string): OnboardingProgress | null {
    return this.onboardingProgress.get(email) || null;
  }

  updateOnboardingProgress(
    email: string,
    updates: Partial<OnboardingProgress>
  ): OnboardingProgress | null {
    const progress = this.onboardingProgress.get(email);
    if (!progress) return null;

    Object.assign(progress, updates);
    progress.lastActivity = Date.now();

    if (updates.walletDeployed) {
      progress.step = 'profile_setup';
    }

    this.saveToStorage();
    return progress;
  }

  completeOnboarding(email: string): OnboardingProgress | null {
    const progress = this.onboardingProgress.get(email);
    if (!progress) return null;

    progress.step = 'completed';
    progress.completedSteps.push('completed');
    progress.profileSetup = true;
    progress.completedAt = Date.now();
    progress.lastActivity = Date.now();

    this.saveToStorage();
    return progress;
  }

  /**
   * Two-Factor Authentication
   */
  enableTwoFactor(email: string): { authenticatorKey: string; qrCode: string } {
    const account = this.smartWallets.get(email);
    if (!account) {
      throw new Error('No wallet found for this email');
    }

    const authenticatorKey = this.generateAuthenticatorKey();
    account.twoFactorEnabled = true;
    account.authenticatorKey = authenticatorKey;

    // Generate QR code (in production, use qrcode library)
    const qrCode = `otpauth://totp/BassBall:${encodeURIComponent(email)}?secret=${authenticatorKey}&issuer=BassBall`;

    this.saveToStorage();
    return { authenticatorKey, qrCode };
  }

  disableTwoFactor(email: string): boolean {
    const account = this.smartWallets.get(email);
    if (!account) return false;

    account.twoFactorEnabled = false;
    account.authenticatorKey = undefined;
    this.saveToStorage();
    return true;
  }

  /**
   * Account Metadata
   */
  updateProfile(
    email: string,
    updates: { displayName?: string; avatar?: string; tier?: 'free' | 'premium' | 'elite' }
  ): SmartWalletAccount | null {
    const account = this.smartWallets.get(email);
    if (!account) return null;

    if (updates.displayName) account.displayName = updates.displayName;
    if (updates.avatar) account.avatar = updates.avatar;
    if (updates.tier) account.tier = updates.tier;

    account.lastActivity = Date.now();
    this.saveToStorage();
    return account;
  }

  /**
   * Email Templates
   */
  private initializeEmailTemplates(): void {
    const templates: EmailTemplate[] = [
      {
        templateId: 'template_verification',
        name: 'Email Verification',
        subject: 'Verify your Bass Ball account',
        htmlBody: `<p>Click <a href="https://bassball.io/verify?token={{token}}">here</a> to verify your email</p>`,
        textBody: 'Verify your email: https://bassball.io/verify?token={{token}}',
        variables: ['token'],
        createdAt: Date.now(),
      },
      {
        templateId: 'template_recovery',
        name: 'Account Recovery',
        subject: 'Recover your Bass Ball account',
        htmlBody: `<p>Click <a href="https://bassball.io/recover?token={{token}}">here</a> to recover your account</p>`,
        textBody: 'Recover your account: https://bassball.io/recover?token={{token}}',
        variables: ['token'],
        createdAt: Date.now(),
      },
      {
        templateId: 'template_welcome',
        name: 'Welcome',
        subject: 'Welcome to Bass Ball on Base',
        htmlBody: `<p>Welcome {{displayName}}! Your wallet has been created on Base network.</p>`,
        textBody: 'Welcome to Bass Ball!',
        variables: ['displayName'],
        createdAt: Date.now(),
      },
    ];

    templates.forEach(template => this.emailTemplates.set(template.templateId, template));
  }

  getEmailTemplate(templateId: string): EmailTemplate | null {
    return this.emailTemplates.get(templateId) || null;
  }

  /**
   * Utility Methods
   */
  private generateVerificationToken(length: number): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateToken(length: number): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(length)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateDeterministicSalt(email: string): string {
    // In production, use proper hashing (keccak256)
    const hash = this.simpleHash(this.SALT_PREFIX + email);
    return `0x${hash.toString(16).padStart(64, '0')}`;
  }

  private simpleHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private deriveWalletAddress(email: string, salt: string): string {
    // Simplified derivation - in production use proper factory address computation
    const hash = this.simpleHash(email + salt);
    return `0x${hash.toString(16).padStart(40, '0').slice(-40)}`;
  }

  private encodeFactoryInitCode(account: SmartWalletAccount): string {
    // Simplified encoding - in production use proper ABI encoding
    return (
      account.factoryAddress.slice(2) +
      '6d59' + // createAccount function selector
      account.salt.slice(2)
    );
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 10)
      ).join('');
      codes.push(code);
    }
    return codes;
  }

  private generateAuthenticatorKey(): string {
    return Array.from({ length: 32 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
    ).join('');
  }

  /**
   * Storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        emailVerifications: Array.from(this.emailVerifications.entries()),
        smartWallets: Array.from(this.smartWallets.entries()),
        walletsByAddress: Array.from(this.walletsByAddress.entries()),
        recoveryRequests: Array.from(this.recoveryRequests.entries()),
        sessionTokens: Array.from(this.sessionTokens.entries()),
        onboardingProgress: Array.from(this.onboardingProgress.entries()),
      };
      localStorage['email_to_wallet_provider'] = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to save email to wallet provider:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage['email_to_wallet_provider'] || '{}');
      if (data.emailVerifications) this.emailVerifications = new Map(data.emailVerifications);
      if (data.smartWallets) this.smartWallets = new Map(data.smartWallets);
      if (data.walletsByAddress) this.walletsByAddress = new Map(data.walletsByAddress);
      if (data.recoveryRequests) this.recoveryRequests = new Map(data.recoveryRequests);
      if (data.sessionTokens) this.sessionTokens = new Map(data.sessionTokens);
      if (data.onboardingProgress) this.onboardingProgress = new Map(data.onboardingProgress);
    } catch (error) {
      console.error('Failed to load email to wallet provider:', error);
    }
  }
}

export type {
  EmailVerificationToken,
  SmartWalletAccount,
  AccountRecoveryRequest,
  WalletInitData,
  SessionToken,
  OnboardingProgress,
  EmailTemplate,
};
