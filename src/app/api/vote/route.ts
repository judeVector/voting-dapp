import { Voting } from "@/../anchor/target/types/voting";
import { BN, Program } from "@coral-xyz/anchor";
import {
  ActionGetResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";

const IDL = require("@/../anchor/target/idl/voting.json");

export const OPTIONS = GET;

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: "https://www.luvele.co.uk/cdn/shop/articles/peanut_butter_01_1024x.png?v=1565171730",
    title: "Vote for your favourite type of peanut butter.",
    description: "Vote between smooth and crunchy peanut butter options.",
    label: "Vote",
    links: {
      actions: [
        {
          label: "Vote for Crunchy",
          href: "/api/vote?candidate=Crunchy",
          type: "transaction",
        },
        {
          label: "Vote for Smooth",
          href: "/api/vote?candidate=Smooth",
          type: "transaction",
        },
      ],
    },
  };
  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");
  const program: Program<Voting> = new Program(IDL, { connection });

  if (candidate != "Crunchy" && candidate != "Smooth") {
    return new Response("Invalid candidate", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const body: ActionPostRequest = await request.json();
  let voter;

  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return new Response("Invalid public key", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const instruction = await program.methods
    .vote(candidate, new BN(1))
    .accounts({
      signer: voter,
    })
    .instruction();

  const blockHash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockHash.blockhash,
    lastValidBlockHeight: blockHash.lastValidBlockHeight,
  }).add(instruction);

  const response = await createPostResponse({
    fields: {
      transaction: transaction,
    },
  });

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}
