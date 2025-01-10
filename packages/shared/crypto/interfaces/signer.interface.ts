export interface ISigner {
  sign(content: Buffer, signingTime?: Date): Promise<Buffer>;
}
