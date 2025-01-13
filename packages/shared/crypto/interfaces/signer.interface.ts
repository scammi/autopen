export interface ISigner {
  sign(
    content: Uint8Array | Buffer,
    signingTime?: Date,
  ): Promise<Buffer | Uint8Array>;
}
