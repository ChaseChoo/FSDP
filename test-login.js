// Test script for login system
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function testSignup() {
    try {
        const response = await fetch(`${BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'John Doe',
                email: 'john@example.com',
                phone: '91234567',
                password: 'TestPass123!',
                confirmPassword: 'TestPass123!'
            })
        });
        
        const result = await response.text();
        console.log('Signup Response:', response.status, result);
        
        if (response.ok) {
            const data = JSON.parse(result);
            return data.token;
        }
    } catch (error) {
        console.error('Signup error:', error.message);
    }
    return null;
}

async function testLogin() {
    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'john@example.com',
                password: 'TestPass123!'
            })
        });
        
        const result = await response.text();
        console.log('Login Response:', response.status, result);
        
        if (response.ok) {
            const data = JSON.parse(result);
            return data.token;
        }
    } catch (error) {
        console.error('Login error:', error.message);
    }
    return null;
}

async function runTests() {
    console.log('Testing EasyATM Login System...\n');
    
    console.log('1. Testing Signup...');
    const signupToken = await testSignup();
    
    console.log('\n2. Testing Login...');
    const loginToken = await testLogin();
    
    console.log('\n✅ Test completed!');
    if (signupToken) console.log('Signup successful - Token received');
    if (loginToken) console.log('Login successful - Token received');
}

runTests();