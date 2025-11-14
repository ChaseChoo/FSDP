import bcrypt from 'bcrypt';

// Test the new hash we just created
const hash = '$2b$12$sDnhLXme9w8FluAbFsHKbezw9ajURy6LYydICGN128282hVMWEaSS';

console.log('Testing PINs against the NEW hash:');
['1234', '0000', '1111', '2222', '9999', '4321', '5678'].forEach(pin => {
    const isValid = bcrypt.compareSync(pin, hash);
    console.log(`PIN ${pin}: ${isValid ? '✅ VALID' : '❌ Invalid'}`);
});