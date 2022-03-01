// TODO: add globally available interfaces for your elements

import { EntryHashB64, AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { Timestamp } from "@holochain/client";
import { createContext, Context } from "@holochain-open-dev/context";
import { AttestationsStore } from "./attestations.store";
import {SignedHeaderHashed } from "@holochain/client"

export const attestationsContext : Context<AttestationsStore> = createContext('hc_zome_attestations/service');

export type Dictionary<T> = { [key: string]: T };

export interface Verifiable {
  attestation?: Attestation,
  signedHeaders: Array<SignedHeaderHashed>,
}

export interface AttestationContext {
  author: AgentPubKeyB64,
  timestamp: number,
}

export interface AttestationOutput {
  hash: EntryHashB64,
  attesters: Array<AttestationContext>,
  verifiable: Verifiable,
  content: Attestation,
}

export interface GetAttestationsInput {
  content?: string,
  by?: AgentPubKeyB64,
  of?: AgentPubKeyB64,
}

export interface AttestationEntry {
  content: string;
  about: AgentPubKeyB64;
}

export interface Attestation  {
  content: string;
  about: AgentPubKeyB64;
}


export type Signal =
  | {
    attestationHash: EntryHashB64, message: {type: "NewAttestation", content:  AttestationEntry}
  }
  
export interface FulfillNonceInput {
  with: AgentPubKeyB64,
  nonce: number,
}
export interface CreateNonceInput {
  with: AgentPubKeyB64,
  note: string,
}