import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ShoppingCartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer' // null for unauthenticated users
    },
    visitorId: {
        type: String // To store UUIDs for visitors
    },
    items: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity cannot be less than 1']
        }
    }]
}, {
    timestamps: true
});

const ShoppingCart = mongoose.model('ShoppingCart', ShoppingCartSchema);

export default ShoppingCart;
