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
        const visits = await db.collection('visits').aggregate([
          {
            $lookup: {
              from: 'visitors',
              localField: 'visitorId',
              foreignField: '_id',
              as: 'visitor'
            }
          },
          { $unwind: '$visitor' },
          { $sort: { checkInTime: -1 } }
        ]).toArray();
        
        return res.status(200).json(visits);

      case 'POST':
        const { visitorId, hostName, purpose, expectedDuration } = req.body;
        
        if (!visitorId || !hostName) {
          return res.status(400).json({ message: 'Visitor ID and host name are required' });
        }

        const newVisit = {
          visitorId: new ObjectId(visitorId),
          hostName,
          purpose: purpose || '',
          expectedDuration: expectedDuration || null,
          checkInTime: new Date(),
          checkOutTime: null,
          status: 'checked-in',
          createdAt: new Date()
        };

        const result = await db.collection('visits').insertOne(newVisit);
        return res.status(201).json({ 
          message: 'Visit checked in successfully', 
          visit: { ...newVisit, _id: result.insertedId }
        });

      case 'PUT':
        const { id } = req.query;
        const { action, ...updateData } = req.body;
        
        if (!id) {
          return res.status(400).json({ message: 'Visit ID is required' });
        }

        let update = { $set: { ...updateData, updatedAt: new Date() } };
        
        if (action === 'checkout') {
          update.$set.checkOutTime = new Date();
          update.$set.status = 'checked-out';
        }

        await db.collection('visits').updateOne(
          { _id: new ObjectId(id) },
          update
        );

        return res.status(200).json({ message: 'Visit updated successfully' });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Visits API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}