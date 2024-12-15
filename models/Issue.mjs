import mongoose from 'mongoose';

const Schema = mongoose.Schema;


const IssueSchema = new Schema({
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    orderID: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    description: {
        type: String,
        required: [true, 'Description of the issue is required']
    },
    status: {
        type: String,
        required: [true, 'Issue status is required'],
        enum: ['open', 'investigating', 'resolved', 'closed'], 
        default: 'open'
    },
    dateReported: {
        type: Date,
        default: Date.now 
    }
}, {
    timestamps: true 
});

const Issue = mongoose.model('Issue', IssueSchema);

export default Issue;
