const { MongoClient, ObjectId } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(uri);
      await cachedClient.connect();
    }

    cachedDb = cachedClient.db('visitas-securiti');
    return cachedDb;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await connectToDatabase();

    switch (req.method) {
      case 'GET':
        const visitors = await db.collection('visitors').find({}).toArray();
        return res.status(200).json(visitors);

      case 'POST':
        const { name, email, company, purpose, photo } = req.body;
        
        if (!name || !email) {
          return res.status(400).json({ message: 'Name and email are required' });
        }

        const newVisitor = {
          name,
          email,
          company: company || '',
          purpose: purpose || '',
          photo: photo || '',
          registeredAt: new Date(),
          status: 'registered'
        };

        const result = await db.collection('visitors').insertOne(newVisitor);
        return res.status(201).json({ 
          message: 'Visitor registered successfully', 
          visitor: { ...newVisitor, _id: result.insertedId }
        });

      case 'PUT':
        const { id } = req.query;
        const updateData = req.body;
        
        if (!id) {
          return res.status(400).json({ message: 'Visitor ID is required' });
        }

        await db.collection('visitors').updateOne(
          { _id: new ObjectId(id) },
          { $set: { ...updateData, updatedAt: new Date() } }
        );

        return res.status(200).json({ message: 'Visitor updated successfully' });

      case 'DELETE':
        const { id: deleteId } = req.query;
        
        if (!deleteId) {
          return res.status(400).json({ message: 'Visitor ID is required' });
        }

        await db.collection('visitors').deleteOne({ _id: new ObjectId(deleteId) });
        return res.status(200).json({ message: 'Visitor deleted successfully' });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Visitors API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}