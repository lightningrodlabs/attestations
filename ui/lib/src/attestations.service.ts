import { CellClient } from '@holochain-open-dev/cell-client';
import { serializeHash, EntryHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import {AttestationOutput, Attestation, AttestationEntry, Signal, GetAttestationsInput, Verifiable} from './types';

export class AttestationsService {
  constructor(
    public cellClient: CellClient,
    protected zomeName = 'hc_zome_attestations'
  ) {}

  get myAgentPubKey() : AgentPubKeyB64 {
    return serializeHash(this.cellClient.cellId[1]);
  }

  async createAttestation(attestation: Attestation): Promise<EntryHashB64> {
    return this.callZome('create_attestation', attestation);
  }

  async getAttestations(input: GetAttestationsInput): Promise<Array<AttestationOutput>> {
    return this.callZome('get_attestations', input);
  }

  async getMyAttestations(): Promise<Array<AttestationOutput>> {
    return this.callZome('get_my_attestations', null);
  }

  async notify(signal: Signal, folks: Array<AgentPubKeyB64>): Promise<void> {
    return this.callZome('notify', {signal, folks});
  }

  async attestationFromEntry(hash: EntryHashB64, entry: AttestationEntry): Promise<Attestation> {
    return {
      content : entry.content,
      about: entry.about,
    }
  }

  async verify(input: Verifiable): Promise<boolean> {
    try {
      await this.callZome('verify', input);
      return true
    }
    catch(e) {
      console.log("Error during verify:", e)
      return false
    }
  }

  private callZome(fn_name: string, payload: any) {
    return this.cellClient.callZome(this.zomeName, fn_name, payload);
  }
}
