// Test script for card authentication
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/card';

async function testCardLogin() {
    try {
        console.log('Testing Card Login...');
        
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cardNumber: '1234567812345678',
                pin: '1234'
            })
        });
        
        const result = await response.text();
        console.log('Login Response Status:', response.status);
        console.log('Login Response:', result);
        
        if (response.ok) {
            const data = JSON.parse(result);
            console.log('✅ Card login successful!');
            console.log('User:', data.user.name);
            console.log('Card:', data.user.cardNumber);
            console.log('Balance:', `$${data.account.balance}`);
            return data.token;
        } else {
            console.log('❌ Card login failed');
        }
    } catch (error) {
        console.error('Login error:', error.message);
    }
    return null;
}

async function testCardRegistration() {
    try {
        console.log('\nTesting Card Registration...');
        
        const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test Elderly User',
                email: 'elderly@example.com',
                phone: '91234567',
                cardNumber: '9999888877776666',
                pin: '9876'
            })
        });
        
        const result = await response.text();
        console.log('Registration Response Status:', response.status);
        console.log('Registration Response:', result);
        
        if (response.ok) {
            console.log('✅ Card registration successful!');
        } else {
            console.log('❌ Card registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error.message);
    }
}

async function testInvalidLogin() {
    try {
        console.log('\nTesting Invalid Login...');
        
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cardNumber: '1234567812345678',
                pin: '0000' // Wrong PIN
            })
        });
        
        const result = await response.text();
        console.log('Invalid Login Response Status:', response.status);
        console.log('Invalid Login Response:', result);
        
        if (response.status === 401) {
            console.log('✅ Invalid login correctly rejected!');
        } else {
            console.log('❌ Invalid login should have been rejected');
        }
    } catch (error) {
        console.error('Invalid login test error:', error.message);
    }
}

async function runCardTests() {
    console.log('🃏 Testing EasyATM Card Authentication System...\n');
    
    // Test valid login
    const token = await testCardLogin();
    
    // Test registration
    await testCardRegistration();
    
    // Test invalid login
    await testInvalidLogin();
    
    console.log('\n🎯 Card Authentication Tests Complete!');
    if (token) {
        console.log('✅ System ready for elderly users with card authentication');
        console.log('🃏 Test with card: 1234567812345678, PIN: 1234');
    }
}

runCardTests();