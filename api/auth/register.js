const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  console.log('Connecting to MongoDB with URI starting with:', uri ? uri.substring(0, 20) + '...' : 'undefined');

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(uri);
      await cachedClient.connect();
      console.log('Connected to MongoDB successfully');
    }

    cachedDb = cachedClient.db('visitas-securiti');
    return cachedDb;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  console.log('Register handler called');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, email, password, role = 'user' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const db = await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      isActive: true
    };

    const result = await db.collection('users').insertOne(newUser);

    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertedId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}