const fs = require('fs');

let content = fs.readFileSync('utils/soroban.ts', 'utf8');

if (!content.includes('@stellar/freighter-api')) {
  content = content.replace('from "@stellar/stellar-sdk";', 'from "@stellar/stellar-sdk";\nimport { isConnected, getPublicKey } from "@stellar/freighter-api";');
}

const checkFunc = `
async function checkWalletMismatch(expectedAddress: string) {
  try {
    if (await isConnected()) {
      const activePublicKey = await getPublicKey();
      if (activePublicKey && activePublicKey !== expectedAddress) {
        throw new Error(\`Wallet mismatch! You connected as \${expectedAddress.slice(0,4)}...\${expectedAddress.slice(-4)} but Freighter is set to \${activePublicKey.slice(0,4)}...\${activePublicKey.slice(-4)}. Please switch your Freighter account.\`);
      }
    }
  } catch (e: any) {
    if (e && e.message && e.message.includes("Wallet mismatch")) throw e;
  }
}
`;

if (!content.includes('async function checkWalletMismatch')) {
  content = content.replace('export async function fundBountyTransaction(', checkFunc + '\nexport async function fundBountyTransaction(');
}

// Map of function names to their address variable names
const funcAddresses = {
  'fundBountyTransaction': 'funderAddress',
  'claimBountyTransaction': 'adminAddress',
  'assignBountyTransaction': 'funderAddress',
  'approveBountyTransaction': 'adminAddress',
  'cancelBountyTransaction': 'funderAddress'
};

// We will find each function body and inject the check
for (const [funcName, addrVar] of Object.entries(funcAddresses)) {
  const searchStr = `export async function ${funcName}`;
  const idx = content.indexOf(searchStr);
  if (idx === -1) continue;
  
  // Find the start of the try block where it signs
  // It looks like:
  //   try {
  //     let signedXdr
  //     if (typeof kit.signTransaction === "function") {
  
  const kitSignIdx = content.indexOf('if (typeof kit.signTransaction', idx);
  if (kitSignIdx !== -1) {
    // Make sure we haven't already injected it
    const snippetBefore = content.substring(kitSignIdx - 100, kitSignIdx);
    if (!snippetBefore.includes('checkWalletMismatch')) {
      content = content.substring(0, kitSignIdx) + `await checkWalletMismatch(${addrVar});\n    ` + content.substring(kitSignIdx);
    }
  }
}

fs.writeFileSync('utils/soroban.ts', content, 'utf8');
console.log("Wallet check injected successfully");
