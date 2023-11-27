const axios = require('axios');

const productData = {
    description: 'This is the third test product',
    price: 300,
    title: 'Test Product 3',
    count: 1
};

axios.post('https://h4y1ufebk7.execute-api.us-east-1.amazonaws.com/products', productData, {
    headers: {
        'Content-Type': 'application/json'
    }
})
    .then(response => {
        console.log('Product created successfully:', response.data);
    })
    .catch(error => {
        console.error('Error creating product:', error);
    });
