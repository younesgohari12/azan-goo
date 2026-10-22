export declare function buildSourceZip(rootDir: string): Promise<Buffer>
export declare function buildZipArchive(files: Array<{ name: string; data: Buffer | string }>): Buffer
export declare const INCLUDED_ENTRIES: string[]
