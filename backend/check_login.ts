import axios from 'axios';

async function login() {
    try {
        const response = await axios.post('http://localhost:3001/auth/login', {
            email: 'testuser@example.com',
            password: 'password123'
        });
        console.log('Login Successful!');
        console.log('Token:', response.data.token ? 'Received' : 'Missing');
        console.log('User:', response.data.user);
    } catch (error: any) {
        console.error('Login Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

login();
