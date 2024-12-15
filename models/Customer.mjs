import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
    userType: { type: String, default: 'customer' },
    username: String,
    email: String,
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    preferences: {
        sweetness: String,
        flavors: String,
        types: [String],
        allergies: [String]
    },
    // https://stackoverflow.com/questions/18001478/referencing-another-schema-in-mongoose
    orderHistory: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    issuesReported: [{ type: Schema.Types.ObjectId, ref: 'Issue' }],
    feedbacksGiven: [{ type: Schema.Types.ObjectId, ref: 'Feedback' }],
    shoppingCart: { type: Schema.Types.ObjectId, ref: 'ShoppingCart' }
});

CustomerSchema.plugin(passportLocalMongoose);

const Customer = mongoose.model('Customer', CustomerSchema);

export default Customer;
