import Owner from './models/Owner.mjs';
import mongoose from 'mongoose';

// https://stackoverflow.com/questions/53702378/how-to-insert-initial-data-in-mongodb-on-app-start
async function seedInitialData() {
    try {
      // check if an owner already exists
      const ownerExists = await Owner.findOne({ username: 'franklin_cheng' });
      if (!ownerExists) {
        // if not, create a new owner
        Owner.register(new Owner({
          username: 'franklin_cheng',
          email: 'haos.bread.house@gmail.com' 
        }), 'pupu9999', (err) => {
          if (err) {
            console.error('Error creating the owner:', err);
            return;
          }
        });
      }
    } catch (err) {
      console.error('Error seeding initial data:', err);
    }
  }

  mongoose.connect(process.env.DSN, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB...');
    seedInitialData();
  })
  .catch(err => console.error('Could not connect to MongoDB...', err));