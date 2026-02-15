import mongoose from 'mongoose';
import '@/lib/models'; // Register all models


interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: Cached = (global as unknown as { mongoose: Cached }).mongoose;

if (!cached) {
  cached = (global as unknown as { mongoose: Cached }).mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectToDatabase(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aryopath';

  if (cached.conn) {
    return cached.conn;
  }

  console.log('🔌 Connecting to MongoDB...');
  console.log('📝 URI Source:', process.env.MONGODB_URI ? 'Environment Variable' : 'Default Fallback');
  console.log('🌐 Host:', MONGODB_URI.split('@').pop());

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;