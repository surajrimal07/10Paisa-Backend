const router = require('express').Router();
const productController = require('../controllers/productController');

//for product
router.get('/product',productController.createProduct)

module.exports = router;

