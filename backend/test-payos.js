const PayOS = require('@payos/node');
console.log('PayOS Type:', typeof PayOS);
console.log('PayOS Keys:', Object.keys(PayOS));
if (PayOS.default) {
  console.log('PayOS.default Type:', typeof PayOS.default);
}
