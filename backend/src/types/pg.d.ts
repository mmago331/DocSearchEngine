declare module "pg" {
  export interface QueryConfig {
    text: string;
    values?: any[];
  }

  export interface QueryResult<T = any> {
    rows: T[];
    rowCount?: number;
  }

  export interface PoolConfig {
    connectionString?: string;
    ssl?: any;
  }

  export interface PoolClient {
    query<T = any>(queryTextOrConfig: string | QueryConfig, values?: any[]): Promise<QueryResult<T>>;
    release(): void;
  }

  export interface Pool {
    query<T = any>(queryTextOrConfig: string | QueryConfig, values?: any[]): Promise<QueryResult<T>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
  }

  export const Pool: {
    new (config?: PoolConfig): Pool;
  };
}
