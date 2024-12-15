import mongoose from 'mongoose';

const Schema = mongoose.Schema;


const FeedbackSchema = new Schema({
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'Customer', 
    },
    content: {
        type: String,
        required: [true, 'Feedback content is required'],
        minlength: [5, 'Feedback content must be at least 5 characters long']
    },
    date: {
        type: Date,
        default: Date.now 
    }
}, {
    timestamps: true 
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);

export default Feedback;
