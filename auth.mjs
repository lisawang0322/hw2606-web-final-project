import passport from 'passport';
import Customer from './models/Customer.mjs';
import Owner from './models/Owner.mjs';

Customer.createStrategy();
Owner.createStrategy();

passport.use('customer-local', Customer.createStrategy());
passport.use('owner-local', Owner.createStrategy());

passport.serializeUser((user, done) => {
    done(null, { id: user.id, userType: user.userType });
});

passport.deserializeUser(async (serializedData, done) => {
    const { id, userType } = serializedData;
    let user;

    try {
        if (userType === 'customer') {
            user = await Customer.findById(id);
        } else if (userType === 'owner') {
            user = await Owner.findById(id);
        }

        if (!user) {
            throw new Error('User not found');
        }

        done(null, user); // The deserialized user object is now attached to req.user
    } catch (error) {
        done(error, null);
    }
});
