import {
  Contract,
  rpc,
  Networks,
  Address,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  BASE_FEE,
} from "@stellar/stellar-sdk";

export const ESCROW_CONTRACT_ID = "CCMPOMD4SZIITQL7SFRT7TT65M656TJERW7TFWOWQ4GKGINP2DW35GYZ";
export const BADGE_CONTRACT_ID = "CDOT3TVM5OBMV56FLZZFXNWZUVLWX65BRHXCI7VWB2MTDRTXN42T35U5"; // Replace with actual deployment
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";

export const server = new rpc.Server(SOROBAN_RPC_URL);

export async function fundBountyTransaction(
  kit: any,
  funderAddress: string,
  bountyId: string | number,
  tokenAddress: string,
  amount: number
) {
  const account = await server.getAccount(funderAddress);
  const contract = new Contract(ESCROW_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "fund_bounty",
        new Address(funderAddress).toScVal(),
        nativeToScVal(Number(bountyId), { type: "u32" }),
        new Address(tokenAddress).toScVal(),
        nativeToScVal(BigInt(amount), { type: "i128" })
      )
    )
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  const preparedTx = rpc.assembleTransaction(tx, simulated);
  const txXdr = preparedTx.build().toXDR();

  if (!kit) return txXdr;

  try {
    let signedXdr = "";
    if (typeof kit.signTransaction === "function") {
      const res = await kit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: funderAddress,
      });
      signedXdr = typeof res === "string" ? res : res?.signedTxXdr || res?.signedXdr || txXdr;
    } else if (typeof kit.sign === "function") {
      const res = await kit.sign({
        xdr: txXdr,
        publicKey: funderAddress,
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

      return { status: "success", hash: response.hash, xdr: signedXdr };
    }
  } catch (err) {
    console.error("Signature request failed:", err);
    throw err;
  }

  return { status: "pending", xdr: txXdr };
}

export async function claimBountyTransaction(
  kit: any,
  adminAddress: string,
  developerAddress: string,
  bountyId: string | number
) {
  const account = await server.getAccount(adminAddress);
  const contract = new Contract(ESCROW_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "claim_bounty",
        new Address(developerAddress).toScVal(),
        nativeToScVal(Number(bountyId), { type: "u32" })
      )
    )
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  const preparedTx = rpc.assembleTransaction(tx, simulated);
  const txXdr = preparedTx.build().toXDR();

  if (!kit) return txXdr;

  try {
    let signedXdr = "";
    if (typeof kit.signTransaction === "function") {
      const res = await kit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: adminAddress,
      });
      signedXdr = typeof res === "string" ? res : res?.signedTxXdr || res?.signedXdr || txXdr;
    } else if (typeof kit.sign === "function") {
      const res = await kit.sign({
        xdr: txXdr,
        publicKey: adminAddress,
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

      return { status: "success", hash: response.hash, xdr: signedXdr };
    }
  } catch (err) {
    console.error("Signature request failed:", err);
    throw err;
  }

  return { status: "pending", xdr: txXdr };
}

export async function assignBountyTransaction(
  kit: any,
  funderAddress: string,
  developerAddress: string,
  bountyId: number
) {
  const account = await server.getAccount(funderAddress);
  const contract = new Contract(ESCROW_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "assign_bounty",
        new Address(developerAddress).toScVal(),
        nativeToScVal(Number(bountyId), { type: "u32" })
      )
    )
    .setTimeout(30)
    .build();

  let txXdr;
  try {
    const simulated = await server.simulateTransaction(tx);
    const preparedTx = rpc.assembleTransaction(tx, simulated);
    txXdr = preparedTx.build().toXDR();
  } catch (err) {
    console.error("Simulation or Assemble failed:", err);
    throw err;
  }

  try {
    let signedXdr;
    if (typeof kit.signTransaction === "function") {
      const res = await kit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: funderAddress,
      });
      signedXdr = typeof res === "string" ? res : res?.signedTxXdr || res?.signedXdr || txXdr;
    } else if (typeof kit.sign === "function") {
      const res = await kit.sign({
        xdr: txXdr,
        publicKey: funderAddress,
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
      return { status: "success", hash: response.hash, xdr: signedXdr };
    }
  } catch (err) {
    console.error("Signature request failed:", err);
    throw err;
  }

  return { status: "pending", xdr: txXdr };
}

export async function getDeveloperBadges(developerAddress: string): Promise<number[]> {
  try {
    const account = await server.getAccount(developerAddress);
    const contract = new Contract(BADGE_CONTRACT_ID);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          "get_badges",
          new Address(developerAddress).toScVal()
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationSuccess(simulated) && simulated.result) {
      const resultVal = simulated.result.retval;
      const badges = scValToNative(resultVal);
      return Array.isArray(badges) ? badges : [];
    }
    return [];
  } catch (err) {
    console.error("Failed to fetch badges:", err);
    return [];
  }
}

export async function getWipBadges(developerAddress: string): Promise<number[]> {
  try {
    const account = await server.getAccount(developerAddress);
    const contract = new Contract(BADGE_CONTRACT_ID);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        contract.call(
          "get_wip_badges",
          new Address(developerAddress).toScVal()
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationSuccess(simulated) && simulated.result) {
      const resultVal = simulated.result.retval;
      const badges = scValToNative(resultVal);
      return Array.isArray(badges) ? badges : [];
    }
    return [];
  } catch (err) {
    console.error("Failed to fetch wip badges:", err);
    return [];
  }
}

export async function cancelBountyTransaction(
  kit: any,
  funderAddress: string,
  bountyId: number
) {
  const account = await server.getAccount(funderAddress);
  const contract = new Contract(ESCROW_CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "cancel_bounty",
        nativeToScVal(Number(bountyId), { type: "u32" })
      )
    )
    .setTimeout(30)
    .build();

  let txXdr;
  try {
    const simulated = await server.simulateTransaction(tx);
    const preparedTx = rpc.assembleTransaction(tx, simulated);
    txXdr = preparedTx.build().toXDR();
  } catch (err) {
    console.error("Simulation or Assemble failed:", err);
    throw err;
  }

  try {
    let signedXdr;
    if (typeof kit.signTransaction === "function") {
      const res = await kit.signTransaction(txXdr, {
        networkPassphrase: Networks.TESTNET,
        address: funderAddress,
      });
      signedXdr = typeof res === "string" ? res : res?.signedTxXdr || res?.signedXdr || txXdr;
    } else if (typeof kit.sign === "function") {
      const res = await kit.sign({
        xdr: txXdr,
        publicKey: funderAddress,
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
      return { status: "success", hash: response.hash, xdr: signedXdr };
    }
  } catch (err) {
    console.error("Signature request failed:", err);
    throw err;
  }

  return { status: "pending", xdr: txXdr };
}
