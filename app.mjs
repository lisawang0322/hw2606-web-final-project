import './config.mjs';
import './db.mjs';
import './auth.mjs';
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/userRoutes.mjs';
import Product from './models/Product.mjs';
import { v4 as uuidv4 } from 'uuid';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
// import cors from 'cors'

const app = express();
const port = process.env.PORT || 3000;

// const corsOptions = {
//     origin: 'http://linserv1.cims.nyu.edu:17264', 
//     methods: ['GET', 'POST', 'DELETE'], 
//     allowedHeaders: ['Content-Type', 'Authorization'], 
//     credentials: true
//   };
  
// app.use(cors(corsOptions)); 

// Serve static file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));

app.use(cookieParser());

const sessionOptions = {
    secret: 'secret for signing session id',
    saveUninitialized: true,
    resave: false,
    cookie: { secure: false }, 
    store: MongoStore.create({ mongoUrl: process.env.DSN })
};

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
    res.locals.user = req.user; // makes user data available to all templates
    next();
});

app.use((req, res, next) => {
    if (req.user) {
        res.locals.username = req.user.username;
    }
    next();
});


app.use((req, res, next) => {

    if (!req.session.visitorId && !req.isAuthenticated()) {
        req.session.visitorId = uuidv4(); // Generate a new UUID for the visitor
        res.cookie('visitorId', req.session.visitorId, { httpOnly: true, secure: true }); // Set it as a secure cookie if over HTTPS
    }
    next();
});

app.use((req, res, next) => {
    console.log('Authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    res.locals.isAuthenticated = req.isAuthenticated();
    if (req.isAuthenticated()) {
        res.locals.isCustomer = req.user.userType === 'customer';
        res.locals.isOwner = req.user.userType === 'owner';
        res.locals.username = req.user.username;
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRoutes);

app.set('view engine', 'hbs');

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/shop', async (req, res) => {
    try {
        // Fetch all products from the database
        const products = await Product.find({});

        // Render the shop page with products from the database
        res.render('shop', {
            title: 'Shop',
            products: products, // Pass the fetched products to the template
            year: new Date().getFullYear() // For the footer copyright year
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
});

app.get('/feedback', (req, res) => {
    res.render('feedback');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.get('/product/:slug', async (req, res) => {
    const slug = req.params.slug; // Get the slug from the URL parameter

    try {
        // Find the product by its slug
        const product = await Product.findOne({ slug: slug });

        if (product) {
            res.render('product', { product: product });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/shopping-cart', async (req, res) => {
    res.render('shopping-cart');
});

app.listen(port);
