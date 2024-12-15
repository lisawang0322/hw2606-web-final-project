import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'Customer', 
        required: true
    },
    items: [{
        productID: {
            type: Schema.Types.ObjectId,
            ref: 'Product', 
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity cannot be less than 1']
        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'in transit', 'completed', 'cancelled', 'refunded'], 
        default: 'pending'
    }
}, {
    timestamps: true 
});


const Order = mongoose.model('Order', OrderSchema);

export default Order;
