import mongoose from 'mongoose';
import mongooseSlugPlugin from "mongoose-slug-plugin";

const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Product price cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Product category is required']
    },
    ingredients: {
        type: [String], 
        default: []
    },
    inStock: {
        type: Boolean,
        default: true
    },
    images: {
        type: [String], 
        default: []
    }
    // TODO: reviews
});

ProductSchema.plugin(mongooseSlugPlugin, { tmpl: '<%=name%>' })
const Product = mongoose.model('Product', ProductSchema);

export default Product;
