require('dotenv').config();
const mongoose = require('mongoose');
const { seedDemoUser, DEMO } = require('./seed');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fintrack');
  await seedDemoUser();
  console.log(`Demo data ready. Sign in with ${DEMO.email} / ${DEMO.password}`);
  await mongoose.disconnect();
})();
