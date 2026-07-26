const fs = require('fs');

// 1. Fix soroban.ts
let soroban = fs.readFileSync('utils/soroban.ts', 'utf8');
soroban = soroban.replace('getPublicKey } from', 'getAddress } from');
soroban = soroban.replace(/getPublicKey\(\)/g, 'getAddress()');
fs.writeFileSync('utils/soroban.ts', soroban, 'utf8');

// 2. Fix claim page TS error
let claim = fs.readFileSync('app/claim/page.tsx', 'utf8');
claim = claim.replace(/hash: result.hash/g, 'hash: (result as any).hash');
claim = claim.replace(/disconnect\(\)/g, '/* disconnect */');
fs.writeFileSync('app/claim/page.tsx', claim, 'utf8');

// 3. Fix create page TS error
let create = fs.readFileSync('app/create/page.tsx', 'utf8');
create = create.replace(/hash: result.hash/g, 'hash: (result as any).hash');
fs.writeFileSync('app/create/page.tsx', create, 'utf8');

console.log("TS fixes applied");
