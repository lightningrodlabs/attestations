// TODO: add globally available interfaces for your elements

import { EntryHashB64, AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { createContext, Context } from "@holochain-open-dev/context";
import { AttestationsStore } from "./attestations.store";

export const attestationsContext : Context<AttestationsStore> = createContext('hc_zome_attestations/service');

export type Dictionary<T> = { [key: string]: T };

export interface AttestationOutput {
  hash: EntryHashB64,
  attesters: Array<AgentPubKeyB64>,
  content: Attestation,
}

export interface GetAttestationsInput {
  content?: string,
  agent?: AgentPubKeyB64,
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
  
