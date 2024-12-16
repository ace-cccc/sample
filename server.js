const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Limit file size to 10MB

const API_KEY = '2b10XRlXiLloNUcCgqm63eE0O';
const PROJECT = 'all';

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            console.log('No file uploaded.');
            return res.status(400).send('No file uploaded.');
        }
        console.log('File uploaded:', req.file.originalname);
        const { buffer, originalname } = req.file;
        const encodedImage = buffer.toString('base64');

        const apiUrl = `https://my-api.plantnet.org/v2/identify/${PROJECT}?api-key=${API_KEY}`;
        console.log('Sending request to PlantNet API');
        const response = await axios.post(apiUrl, {
            images: [encodedImage],
            organs: ['flower', 'leaf']
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Received response from PlantNet API:', response.data);

        const plantDetails = response.data;
        res.json({ result: plantDetails });
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).send('Something went wrong!');
    }
});

app.post('/proxy-identify', async (req, res) => {
    const { images, organs } = req.body;
    try {
        const apiUrl = `https://my-api.plantnet.org/v2/identify/${PROJECT}?api-key=${API_KEY}`;
        console.log('Proxy sending request to PlantNet API');
        console.log('Request Data:', JSON.stringify({ images, organs }));

        // Validate input data
        if (!images || !organs) {
            throw new Error('Invalid input data');
        }

        const response = await axios.post(apiUrl, {
            images,
            organs
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Received response from PlantNet API:', response.data);
        res.json(response.data);
    } catch (error) {
        if (error.response) {
            console.error('Proxy Error:', error.response.status);
            console.error('Proxy Error Data:', error.response.data);
            res.status(500).send(error.response.data);
        } else if (error.request) {
            console.error('Proxy Error: No response received');
            console.error('Proxy Error Request:', error.request);
            res.status(500).send('No response received from PlantNet API');
        } else {
            console.error('Proxy Error Message:', error.message);
            res.status(500).send(error.message);
        }
        console.error('Request Data:', JSON.stringify({ images, organs }));
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
