import { CellClient } from '@holochain-open-dev/cell-client';
import { HoloHashed, serializeHash, EntryHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import {AttestationEntry, Attestation, Signal} from './types';

export class AttestationsService {
  constructor(
    public cellClient: CellClient,
    protected zomeName = 'hc_zome_attestations'
  ) {}

  get myAgentPubKey() : AgentPubKeyB64 {
    return serializeHash(this.cellClient.cellId[1]);
  }

  async createAttestation(attestation: AttestationEntry): Promise<EntryHashB64> {
    return this.callZome('create_attestation', attestation);
  }

  async getAttestations(agent: AgentPubKeyB64): Promise<Array<HoloHashed<AttestationEntry>>> {
    return this.callZome('get_attestations', agent);
  }

  async getMyAttestations(): Promise<Array<HoloHashed<AttestationEntry>>> {
    return this.callZome('get_my_attestations', null);
  }

  async notify(signal: Signal, folks: Array<AgentPubKeyB64>): Promise<void> {
    return this.callZome('notify', {signal, folks});
  }

  async attestationFromEntry(hash: EntryHashB64, entry: AttestationEntry): Promise<Attestation> {
    return {
      content : entry.content,
      about: entry.about,
      meta : entry.meta,
    }
  }

  private callZome(fn_name: string, payload: any) {
    return this.cellClient.callZome(this.zomeName, fn_name, payload);
  }
}
