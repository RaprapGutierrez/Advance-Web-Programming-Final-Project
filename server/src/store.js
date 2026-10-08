// In-memory data store. Replace with Mongoose models when the database is added.
const { randomUUID } = require('crypto');
const db = { renters: [], studios: [], equipment: [], bookings: [], payments: [] };
const uid = () => randomUUID();
const STUDIO_TYPES = ['Music', 'Photo', 'Dance', 'Podcast'];
const METHODS = ['cash', 'gcash', 'card'];
module.exports = { db, uid, STUDIO_TYPES, METHODS };
