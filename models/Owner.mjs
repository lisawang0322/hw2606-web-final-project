import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const Schema = mongoose.Schema;

const OwnerSchema = new Schema({
    userType: { type: String, default: 'owner' } ,
    username: String,
    email: String,
    fullName: String,
});

OwnerSchema.plugin(passportLocalMongoose);

const Owner = mongoose.model('Owner', OwnerSchema);

export default Owner;
