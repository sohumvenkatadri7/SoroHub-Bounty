const fs = require('fs');

let soroban = fs.readFileSync('utils/soroban.ts', 'utf8');
soroban = soroban.replace(/activePublicKey !== expectedAddress/g, 'activePublicKey.address !== expectedAddress');
soroban = soroban.replace(/activePublicKey\.slice/g, 'activePublicKey.address.slice');
fs.writeFileSync('utils/soroban.ts', soroban, 'utf8');

let claim = fs.readFileSync('app/claim/page.tsx', 'utf8');
// Replace "result.hash" with "(result as any).hash" properly
claim = claim.replace(/if \(result\.hash\)/g, 'if ((result as any).hash)');
claim = claim.replace(/hash: result\.hash/g, 'hash: (result as any).hash');
// Remove disconnect
claim = claim.replace(/\/\* disconnect \*\/\(\)/g, '');
fs.writeFileSync('app/claim/page.tsx', claim, 'utf8');

let create = fs.readFileSync('app/create/page.tsx', 'utf8');
create = create.replace(/if \(result\.hash\)/g, 'if ((result as any).hash)');
create = create.replace(/hash: result\.hash/g, 'hash: (result as any).hash');
fs.writeFileSync('app/create/page.tsx', create, 'utf8');

console.log("Fixed");
