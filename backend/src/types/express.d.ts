import "express-serve-static-core";

declare global {
  namespace Express {
    namespace Multer {
      interface File {
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
    }
  }
}

declare module "express-serve-static-core" {
  interface Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
  }
}
