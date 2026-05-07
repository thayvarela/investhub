
import axios from 'axios';

async function main() {
    try {
        // Health Check
        try {
            const health = await axios.get('http://localhost:3001/');
            console.log('Health Check:', health.data);
        } catch (e: any) {
            console.log('Health Check Failed:', e.message);
        }

        const response = await axios.post('http://localhost:3001/auth/login', {
            email: 'testuser@example.com',
            password: 'password123'
        });
        console.log('Login Successful:', response.data);
    } catch (error: any) {
        console.error('Login Error Full:', error);
        if (error.code) console.error('Error Code:', error.code);
    }
}

main();
