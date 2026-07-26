import sys
import re

with open('frontend/utils/soroban.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import at the top
if 'from "@stellar/freighter-api"' not in content:
    content = content.replace('from "@stellar/stellar-sdk";', 'from "@stellar/stellar-sdk";\nimport { isConnected, getPublicKey } from "@stellar/freighter-api";')

# Define the helper function
helper_func = """
async function signAndSubmitTransaction(kit: any, txXdr: string, expectedAddress: string) {
  try {
    if (await isConnected()) {
      const activePublicKey = await getPublicKey();
      if (activePublicKey && activePublicKey !== expectedAddress) {
        throw new Error(Wallet mismatch! You connected as ... but Freighter is set to .... Please switch your Freighter account.);
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

      await new Promise(resolve => setTimeout(resolve, 5000));

      return { status: "success", hash: (response as any).hash, xdr: signedXdr };
    }
  } catch (err: any) {
    console.error("Signature request failed:", err);
    throw err;
  }

  return { status: "pending", xdr: txXdr };
}
"""

if 'async function signAndSubmitTransaction' not in content:
    # Insert helper before fundBountyTransaction
    content = content.replace('export async function fundBountyTransaction(', helper_func + '\nexport async function fundBountyTransaction(')

# Now replace the try-catch block in all functions
# It looks like:
#   try {
#     let signedXdr = "";
# ... (about 35 lines)
#   return { status: "pending", xdr: txXdr };

# The regex matches from "try {\n    let signedXdr" up to "return { status: "pending", xdr: txXdr };"

pattern1 = r'try \{\s*let signedXdr = "";\s*if \(typeof kit\.signTransaction === "function"\) \{\s*const res = await kit\.signTransaction\(txXdr, \{\s*networkPassphrase: Networks\.TESTNET,\s*address: (.*?),.*?return \{ status: "pending", xdr: txXdr \};'
content = re.sub(pattern1, r'return await signAndSubmitTransaction(kit, txXdr, \1);', content, flags=re.DOTALL)

with open('frontend/utils/soroban.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactoring done.")
