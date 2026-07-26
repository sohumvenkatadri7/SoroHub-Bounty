const fs = require('fs');

let content = fs.readFileSync('utils/soroban.ts', 'utf8');

if (!content.includes('@stellar/freighter-api')) {
  content = content.replace('from "@stellar/stellar-sdk";', 'from "@stellar/stellar-sdk";\nimport { isConnected, getPublicKey } from "@stellar/freighter-api";');
}

const helperFunc = `
async function signAndSubmitTransaction(kit: any, txXdr: string, expectedAddress: string) {
  try {
    if (await isConnected()) {
      const activePublicKey = await getPublicKey();
      if (activePublicKey && activePublicKey !== expectedAddress) {
        throw new Error(\`Wallet mismatch! You connected as \${expectedAddress.slice(0,4)}...\${expectedAddress.slice(-4)} but Freighter is set to \${activePublicKey.slice(0,4)}...\${activePublicKey.slice(-4)}. Please switch your Freighter account.\`);
      }
    }
  } catch (e) {
    // Ignore error in checking
  }

  try {
    let signedXdr = "";
    if (typeof kit.signTransaction === "function") {
      const res = await kit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: expectedAddress,
      });
      signedXdr = typeof res === "string" ? res : res?.signedTxXdr || res?.signedXdr || txXdr;
    } else if (typeof kit.sign === "function") {
      const res = await kit.sign({
        xdr: txXdr,
        publicKey: expectedAddress,
        networkPassphrase: Networks.TESTNET,
      });
      signedXdr = typeof res === "string" ? res : res?.signedTxXdr || res?.signedXdr || txXdr;
    }

    if (signedXdr && signedXdr !== txXdr) {
      const txToSubmit = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
      const response = await server.sendTransaction(txToSubmit as any);
      
      if (response.status === "ERROR") {
        throw new Error("Transaction failed to submit");
      }

      // Hack: stellar-sdk currently has a parsing bug with getTransaction (Bad union switch)
      // for Soroban transactions. We will just wait 5 seconds to let it close on the ledger.
      await new Promise(resolve => setTimeout(resolve, 5000));

      return { status: "success", hash: (response as any).hash, xdr: signedXdr };
    }
  } catch (err: any) {
    console.error("Signature request failed:", err);
    throw err;
  }

  return { status: "pending", xdr: txXdr };
}
`;

if (!content.includes('async function signAndSubmitTransaction')) {
  content = content.replace('export async function fundBountyTransaction(', helperFunc + '\nexport async function fundBountyTransaction(');
}

const regex = /try \{\s*let signedXdr = "";\s*if \(typeof kit\.signTransaction === "function"\) \{\s*const res = await kit\.signTransaction\(txXdr, \{\s*networkPassphrase: Networks\.TESTNET,\s*address: (.*?),.*?\s*return \{ status: "pending", xdr: txXdr \};\n\s*\}/gs;

content = content.replace(regex, (match, addressVar) => {
  return `return await signAndSubmitTransaction(kit, txXdr, ${addressVar});`;
});

fs.writeFileSync('utils/soroban.ts', content, 'utf8');
console.log("Refactored successfully");
