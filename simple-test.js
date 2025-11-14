// Simple test for card login
const testCardLogin = async () => {
    try {
        console.log('Testing card login endpoint...');
        
        const response = await fetch('http://localhost:3000/api/card/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cardNumber: '1234567812345678',
                pin: '1234'
            })
        });
        
        console.log('Response status:', response.status);
        const text = await response.text();
        console.log('Response text:', text);
        
        if (response.ok) {
            const data = JSON.parse(text);
            console.log('✅ Success!');
            console.log('Token:', data.token ? 'Present' : 'Missing');
            console.log('User:', data.user?.name || 'N/A');
            console.log('Balance:', data.account?.balance || 'N/A');
        } else {
            console.log('❌ Failed with status:', response.status);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
};

// Use global fetch if available
if (typeof fetch === 'undefined') {
    import('node-fetch').then(({ default: fetch }) => {
        global.fetch = fetch;
        testCardLogin();
    });
} else {
    testCardLogin();
}