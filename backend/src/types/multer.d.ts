import type { Request, RequestHandler } from "express";

declare module "multer" {
  interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer: Buffer;
    stream: NodeJS.ReadableStream;
  }

  interface MulterStorageEngine {
    _handleFile(
      req: Request,
      file: { stream: NodeJS.ReadableStream; originalname: string; mimetype: string },
      callback: (error?: any, info?: Partial<MulterFile>) => void
    ): void;
    _removeFile(req: Request, file: MulterFile, callback: (error: Error | null) => void): void;
  }

  interface MulterInstance {
    single(fieldname: string): RequestHandler;
    array(fieldname: string, maxCount?: number): RequestHandler;
    fields(fields: Array<{ name: string; maxCount?: number }>): RequestHandler;
    none(): RequestHandler;
    any(): RequestHandler;
  }

  type MulterOptions = {
    storage?: MulterStorageEngine;
    fileFilter?: (req: Request, file: MulterFile, callback: (error: Error | null, acceptFile: boolean) => void) => void;
    limits?: Record<string, unknown>;
  };

  function multer(options?: MulterOptions): MulterInstance;

  namespace multer {
    type File = MulterFile;
    type Options = MulterOptions;
    type StorageEngine = MulterStorageEngine;
  }

  export = multer;
}
