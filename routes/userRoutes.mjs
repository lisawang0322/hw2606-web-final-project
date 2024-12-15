import express from 'express';
import passport from 'passport';
import '../auth.mjs';
import ShoppingCart from '../models/Cart.mjs';
import Issue from '../models/Issue.mjs';
import Order from '../models/Order.mjs';
import Feedback from '../models/Feedback.mjs';
import Customer from '../models/Customer.mjs';
import Product from '../models/Product.mjs';
import { isAuthenticated, isOwner, isCustomer } from '../middlewares/authMiddleware.mjs';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// https://medium.com/@jayantchoudhary271/building-role-based-access-control-rbac-in-node-js-and-express-js-bc870ec32bdb

router.post('/submit-feedback', async (req, res) => {
    const { content } = req.body; // expecting the feedback content from the request
    const userID = req.isAuthenticated() ? req.user.id : undefined; // capture userID if the user is authenticated

    // Basic validation to ensure feedback content is provided
    if (!content) {
        return res.status(400).json({ message: 'Feedback content is required' });
    }

    try {
        // Create and save the new feedback
        const newFeedback = new Feedback({
            userID, // This will be 'undefined' for visitors, which is acceptable as 'userID' is not required
            content
        });
        await newFeedback.save();

        res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-to-cart', async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.isAuthenticated() ? req.user.id : null;
    const visitorId = req.session.visitorId;

    try {
        let cart = await ShoppingCart.findOne({ $or: [{ userId }, { visitorId }] });
        if (!cart) {
            cart = new ShoppingCart({ userId, visitorId, items: [] });
        }

        const index = cart.items.findIndex(item => item.productId.toString() === productId);
        if (index > -1) {
            cart.items[index].quantity += parseInt(quantity, 10);
        } else {
            cart.items.push({ productId, quantity: parseInt(quantity, 10) });
        }

        await cart.save();
        res.status(200).json({ success: true, message: "Product added to cart", cart });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ success: false, message: 'Failed to add item to cart' });
    }
});

router.delete('/delete-cart-item/:itemId', async (req, res) => {
    const itemId = req.params.itemId;
    const userId = req.isAuthenticated() ? req.user.id : null;
    const visitorId = req.session.visitorId;

    try {
        const cart = await ShoppingCart.findOne({ $or: [{ userId }, { visitorId }] });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const index = cart.items.findIndex(item => item._id.toString() === itemId);
        if (index === -1) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        cart.items.splice(index, 1);
        await cart.save();
        res.status(200).json({ success: true, message: "Item removed from cart" });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ success: false, message: 'Failed to remove item from cart' });
    }
});

router.get('/my-shopping-cart', async (req, res) => {
    try {
        const userId = req.isAuthenticated() ? req.user._id : null;
        const visitorId = req.session.visitorId;

        console.log(`Fetching cart for ${userId ? 'user ID: ' + userId : 'visitor ID: ' + visitorId}`);

        const cart = await ShoppingCart.findOne({ $or: [{ userId }, { visitorId }] }).populate({
            path: 'items.productId',
            select: 'name price images' 
        });

        let cartItemsRemoved = false;

        if (!cart || cart.items.length === 0) {
            console.log('No cart or empty cart found');
            return res.render('shopping-cart', { cartItems: [], cartItemsRemoved });
        }

        // Filter out any items that do not have a valid product reference (null check)
        const cartItems = cart.items.reduce((filteredItems, item) => {
            if (item.productId) { // Check if the product still exists
                filteredItems.push({
                    _id: item._id,
                    name: item.productId.name,
                    price: item.productId.price,
                    image: item.productId.images.length ? item.productId.images[0] : '/path/to/default/image.jpg',
                    quantity: item.quantity
                });
            }
            return filteredItems;
        }, []);

        if (cartItems.length !== cart.items.length) {

            // update the cart in the database here if you want to remove the missing items permanently
            cartItemsRemoved = true;
            await cart.save();
        }

        if (cartItemsRemoved && !req.session.cartItemsRemovedAlerted) {
            req.session.cartItemsRemovedAlerted = true; // Set flag to prevent message from showing again
        } else {
            cartItemsRemoved = false; // Reset flag if no items were removed or message was already shown
        }

       // console.log(`Cart Items: ${JSON.stringify(cartItems)}`); 
        res.render('shopping-cart', { cartItems, cartItemsRemoved });
    } catch (error) {
        console.error('Failed to fetch shopping cart:', error);
    }
});


router.post('/register',
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 5 }),
    body('fullName').trim().escape(),
    body('street').trim().escape(),
    body('city').trim().escape(),
    body('state').trim().escape(),
    body('zipCode').trim().escape(),
    body('sweetness').trim().escape(),
    body('flavors').trim().escape(),
    body('types').toArray(),
    body('allergies').toArray(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            username, password, email, fullName,
            'street': street,
            'city': city,
            'state': state,
            'zipCode': zipCode,
            'sweetness': sweetness,
            'flavors': flavors,
            'types': types,
            'allergies': allergies
        } = req.body;

        try {
            const newUser = new Customer({
                username,
                email,
                fullName,
                address: { street, city, state, zipCode },
                preferences: { sweetness, flavors, types, allergies }
            });

            Customer.register(newUser, password, (err, registeredUser) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: err.message });
                }

                // Automatically log in the user after registration
                req.login(registeredUser, loginErr => {
                    if (loginErr) {
                        console.error(loginErr);
                        return res.status(500).json({ message: loginErr.message });
                    }
                    res.status(201).json({ message: 'Registration successful', user: registeredUser });
                });
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);


async function mergeCarts(userId, visitorCart) {
    try {
        if (!visitorCart || visitorCart.items.length === 0) {
            console.log("No items in the visitor cart to merge.");
            return;
        }

        let userCart = await ShoppingCart.findOne({ userId });
        if (!userCart) {
            userCart = new ShoppingCart({ userId, items: [] });
        }

        visitorCart.items.forEach(visitorItem => {
            const existingItem = userCart.items.find(item => item.productId.equals(visitorItem.productId));
            if (existingItem) {
                existingItem.quantity += visitorItem.quantity;
            } else {
                userCart.items.push(visitorItem);
                console.log('pushed!');
            }
        });

        await userCart.save();
        console.log("Cart merged successfully.");
    } catch (error) {
        console.error("Error during cart merging:", error);
    }
}

router.post('/login', (req, res, next) => {
    // Extract userType from the request body
    const { userType } = req.body;
    const visitorId = req.cookies['visitorId'];

    ShoppingCart.findOne({ visitorId }).populate('items.productId', 'name price images')
        .then(visitorCart => {
            // Define a callback function to handle authentication
            const authenticateCallback = (err, user) => {
                if (err) {return next(err);}
                if (!user) {
                    // Handle failure: no user found or incorrect password
                    return res.redirect('/login'); // Redirect with a failure message
                }
                req.login(user, async (loginErr) => {
                    if (loginErr) {return next(loginErr);}

                    if (user.userType !== userType) {
                        // If they don't match, treat it as an authentication failure
                        return res.redirect('/login'); // Redirect with a message indicating the role mismatch
                    }

                    // If the authenticated user is a customer, merge carts
                    if (userType === 'customer') {
                        try {
                            await mergeCarts(user._id, visitorCart);
                        } catch (mergeError) {
                            console.error('Error merging carts:', mergeError);
                            return res.status(500).json({ message: 'Failed to merge carts' });
                        }
                    }

                    // Redirect based on userType
                    return res.redirect(userType === 'customer' ? '/user/customer-dashboard' : '/user/owner-dashboard');
                });
            };

            // Choose the authentication strategy based on userType and call authenticate
            const strategy = userType === 'customer' ? 'customer-local' : 'owner-local';
            passport.authenticate(strategy, authenticateCallback)(req, res, next);
        })
        .catch(error => {
            console.error('Error retrieving visitor cart:', error);
            return res.status(500).json({ message: 'Failed to retrieve visitor cart' });
        });
});


router.use(isAuthenticated);

router.get('/customer-dashboard', isCustomer, (req, res) => {
    res.render('customer-dashboard');
});

router.get('/owner-dashboard', isOwner, (req, res) => {
    res.render('owner-dashboard');
});

async function calculateTotalPrice(items) {

    let totalPrice = 0;
    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (product) {
            totalPrice += product.price * item.quantity;
        }
    }
    return totalPrice;
}

router.post('/submit-order', isCustomer, async (req, res) => {
    const userID = req.user.id; // The authenticated customer's ID

    try {
        // Fetch the customer's shopping cart
        const cart = await ShoppingCart.findOne({ userId: userID });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        // Calculate total price
        const totalPrice = await calculateTotalPrice(cart.items);

        // Create the order in the database
        const newOrder = new Order({
            userID,
            items: cart.items,
            totalPrice,
            status: 'pending'
        });
        await newOrder.save();

        // Clear the customer's shopping cart after successful order submission
        await ShoppingCart.findOneAndUpdate({ userId: userID }, { $set: { items: [] } });

        res.status(201).json({ message: 'Order submitted successfully', order: newOrder });
    } catch (error) {
        console.error('Error submitting order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/my-orders', isCustomer, async (req, res) => {
    const userID = req.user.id;

    try {
        const orders = await Order.find({ userID }).sort('-orderDate').populate('items.productId', 'name price');

        res.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/submit-issue', isAuthenticated, isCustomer, async (req, res) => {
    const { orderID, description } = req.body; // Expecting the ID of the order and the issue description from the request
    const userID = req.user.id; // The authenticated user's ID

    // Basic validation to ensure an order ID and description are provided
    if (!orderID || !description) {
        return res.status(400).json({ message: 'Order ID and description are required' });
    }

    try {
        // Verify that the order exists and belongs to the user
        const order = await Order.findById(orderID);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.userID.toString() !== userID) {
            return res.status(403).json({ message: 'You can only raise issues for your own orders' });
        }

        // Create and save the new issue
        const newIssue = new Issue({
            userID,
            orderID,
            description,
            status: 'open'
        });
        await newIssue.save();

        res.status(201).json({ message: 'Issue submitted successfully', issue: newIssue });
    } catch (error) {
        console.error('Error submitting issue:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

router.get('/add-product', isOwner, (req, res) => {
    res.render('add-product');
});

// https://www.youtube.com/watch?v=wIOpe8S2Mk8
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/uploads/';

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const filename = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage }).array('images', 5);

router.post('/add-product', isOwner, upload, async (req, res) => {
    const { name, description, price, category, ingredients } = req.body;
    const inStock = req.body.inStock ? true : false;
    const ingredientsArray = ingredients ? ingredients.split(',') : [];

    let imagesUrls = [];
    if (req.files) {
        imagesUrls = req.files.map(file => {
            return file.path.replace('public', '');
        });
    }

    const newProduct = new Product({
        name,
        description,
        price: Number(price),
        category,
        ingredients: ingredientsArray,
        inStock,
        images: imagesUrls
    });

    try {
        await newProduct.save();
        res.redirect('/shop');
    } catch (error) {
        console.error('Error adding new product:', error);
        res.status(500).send('Error adding new product');
    }
});

router.get('/edit-product/:slug', isOwner, async (req, res) => {
    try {
        const slug = req.params.slug;
        const product = await Product.findOne({ slug: slug });

        if (!product) {
            return res.status(404).send('Product not found');
        }

        const categories = ['Breads', 'Cakes', 'Scones', 'Pastries', 'Cookies'];

        const categoriesWithSelected = categories.map(category => ({
            name: category,
            selected: category === product.category
        }));

        res.render('edit-product', {
            title: 'Edit Product',
            product,
            categories: categoriesWithSelected
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).send('Error displaying the edit product form');
    }
});


router.post('/edit-product/:slug', isOwner, upload, async (req, res) => {
    const slug = req.params.slug;
    const { name, description, price, category, ingredients, inStock } = req.body;

    let imagesUrls = [];
    if (req.files) {
        imagesUrls = req.files.map(file => file.path.replace('public', ''));
    }

    try {
        const updatedProduct = {
            name,
            description,
            price: Number(price),
            category,
            ingredients: ingredients ? ingredients.split(',') : [],
            inStock: inStock ? true : false,
            ...(imagesUrls.length > 0 && { images: imagesUrls })
        };

        const product = await Product.findOneAndUpdate({ slug: slug }, updatedProduct, { new: true });

        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.redirect('/shop');
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Error updating product');
    }
});


// https://stackoverflow.com/questions/5315138/node-js-remove-file
router.delete('/delete-product/:slug', isOwner, async (req, res) => {
    try {
        const { slug } = req.params;
        const product = await Product.findOneAndDelete({ slug });

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Handle image deletion
        if (product.images && product.images.length > 0) {
            const deletePromises = product.images.map(image => {
                console.log(image);
                const imagePath = path.join(__dirname, '..', 'public', image); 
                return fs.promises.unlink(imagePath).catch(err => {
                    console.error('Failed to delete image:', err.message);
                });
            });

            // Execute all the delete operations
            await Promise.all(deletePromises);
        }

        res.send('Product and associated images deleted successfully');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Error deleting the product');
    }
});

router.get('/change-address', isCustomer, async (req, res) => {
    try {
        const user = await Customer.findById(req.user._id);
        if (!user) {
            return res.status(404).render('error', { message: 'User not found' });
        }
        res.render('change-address', { user: user });
    } catch (error) {
        console.error(`Failed to fetch user data: ${error}`);
        res.status(500).render('error', { message: 'Failed to load address change form' });
    }
});

router.post('/change-address', [
    isCustomer,
    body('street').trim().escape(),
    body('city').trim().escape(),
    body('state').trim().escape(),
    body('zipCode').isPostalCode('any').withMessage('Please enter a valid zip code'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('change-address', {
            errors: errors.array(),
            user: req.user
        });
    }

    const { street, city, state, zipCode } = req.body;

    try {
        await Customer.findByIdAndUpdate(req.user._id, {
            'address.street': street,
            'address.city': city,
            'address.state': state,
            'address.zipCode': zipCode
        });

        res.redirect('/user/customer-dashboard');
    } catch (error) {
        console.error(`Failed to update address: ${error}`);
        res.status(500).render('error', { message: 'Failed to update address' });
    }
});



export default router;
