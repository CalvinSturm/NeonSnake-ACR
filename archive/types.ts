
export type AIModuleTier = 'NONE' | 'MISSING' | 'ORACLE';

export interface ArchiveCapabilities {
  aiModuleTier: AIModuleTier;
}

export type EncryptionType = 'LEGACY_AES' | 'POST_MODERN_QUANTUM' | 'TEMPORAL_LOCK';

export interface VirtualFile {
  id: string; // Unique ID for unlocking
  name: string;
  type: 'file' | 'dir';
  
  // Metadata
  sizeDisplay: string; // The "public" or "obfuscated" size (e.g. "???GB")
  sizeReal?: string;   // The actual size revealed by ORACLE
  sizeBytes: number;   // NEW: Numeric size for sorting
  
  modified: string;    // human-readable string
  modifiedTs: number;  // NEW: Timestamp for sorting
  
  permissions: string; // e.g. "-rw-r--r--"
  
  // Security
  encrypted?: {
    type: EncryptionType;
  };

  // Content Variants
  content?: string;        // Base content (Raw data or default view)
  contentSummary?: string; // Interpretation by "MISSING" AI (often misleading)
  contentFull?: string;    // Full decryption by "ORACLE" AI
  
  // AI Metadata
  confidence?: number;     // Displayed in SUMMARY MODE (0.0 - 1.0)
  
  // Visibility Filter
  visibleWhen?: (caps: ArchiveCapabilities) => boolean;
}

export interface VirtualDirectory {
  path: string;
  contents: VirtualFile[];
}
