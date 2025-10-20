import pkg from 'pg';

const { Pool } = pkg;

const CONNECTION_ENV_KEYS = [
  'PG_URL',
  'POSTGRES_URL',
  'POSTGRESQL_URL',
  'PG_CONNECTION_STRING'
];

function getConnectionString() {
  for (const key of CONNECTION_ENV_KEYS) {
    const value = process.env[key];
    if (value) {
      return { value, source: key };
    }
  }
  return { value: null, source: null };
}

function shouldEnableSsl(connectionString) {
  if (!connectionString) {
    return false;
  }

  const explicitSetting = process.env.PG_SSL?.toLowerCase();
  if (explicitSetting === 'true') {
    return true;
  }
  if (explicitSetting === 'false') {
    return false;
  }

  const normalized = connectionString.toLowerCase();
  if (normalized.includes('sslmode=require') || normalized.includes('sslmode=verify-full')) {
    return true;
  }

  if (
    normalized.includes('azure.com') ||
    normalized.includes('render.com') ||
    normalized.includes('supabase.co')
  ) {
    return true;
  }

  return false;
}

// Create connection pool using the PG_URL environment variable.
// For development, fall back to mock mode if connection fails.
let pool = null;

const connectionString = process.env.PG_URL;

if (connectionString) {
  try {
    const poolConfig = { connectionString };

    if (shouldEnableSsl(connectionString)) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }

    pool = new Pool(poolConfig);
    pool.on('error', (error) => {
      console.error('Unexpected database error:', error);
    });

    console.log('Using PostgreSQL connection string from PG_URL');
  } catch (error) {
    console.warn('PostgreSQL connection failed, using mock mode:', error.message);
    pool = null;
  }
} else {
  console.log('No PG_URL provided, using mock mode for database operations');
}

export function createConnection() {
  return pool;
}

export async function executeQuery(query, parameters = []) {
  if (!pool) {
    console.warn('Database not available, returning mock data');
    // Return mock data for development
    if (query.includes('SELECT') && query.includes('search_index')) {
      return [
        {
          id: 1,
          title: 'Sample Document',
          snippet: 'This is a sample document for testing purposes.',
          created_at: new Date(),
          uploader_name: 'Test User',
          filter_type: 'public'
        }
      ];
    }
    return [];
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(query, parameters);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function initializeDatabase() {
  try {
    if (!pool) {
      console.log('Database not available, running in mock mode');
      return true;
    }
    
    console.log('Connecting to PostgreSQL database...');
    
    // Test connection with timeout
    try {
      await Promise.race([
        executeQuery('SELECT NOW()'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
      console.log('Connected to PostgreSQL database');
    } catch (connectionError) {
      console.warn('Database connection failed, switching to mock mode:', connectionError.message);
      pool = null; // Switch to mock mode
      return true;
    }
    
    // Create tables if they don't exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await executeQuery(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS document_content (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        page_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      )
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS search_index (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        page_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better search performance
    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_search_index_content 
      ON search_index USING gin(to_tsvector('english', content))
    `);

    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_documents_user_id 
      ON documents(user_id)
    `);

    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_documents_is_public 
      ON documents(is_public)
    `);

    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
