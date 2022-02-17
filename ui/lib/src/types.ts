// TODO: add globally available interfaces for your elements

import { EntryHashB64, AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { createContext, Context } from "@holochain-open-dev/context";
import { AttestationsStore } from "./attestations.store";

export const attestationsContext : Context<AttestationsStore> = createContext('hc_zome_attestations/service');

export type Dictionary<T> = { [key: string]: T };


export interface AttestationEntry {
  content: string;
  about: AgentPubKeyB64;
  meta?: Dictionary<string>;
}

export interface Attestation  {
  content: string;
  about: AgentPubKeyB64;
  meta?: Dictionary<string>;
}


export type Signal =
  | {
    attestationHash: EntryHashB64, message: {type: "NewAttestation", content:  AttestationEntry}
  }
  
