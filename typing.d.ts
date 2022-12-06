declare interface StorageCredentials {
  id: string;
  documentStoreKey: string;
  expiredTime: number;
  startTime: number;
  credentials: ObjectStoreTokens;
}

declare interface AccessObject {
  region: string;
  bucket: string;
}

declare interface ObjectStoreTokens {
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  stsToken: string;
}
