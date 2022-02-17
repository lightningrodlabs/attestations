import { EntryHashB64, HeaderHashB64, AgentPubKeyB64, serializeHash } from '@holochain-open-dev/core-types';
import { CellClient } from '@holochain-open-dev/cell-client';
import { writable, Writable, derived, Readable, get } from 'svelte/store';

import { AttestationsService } from './attestations.service';
import {
  Dictionary,
  Attestation,
  AttestationEntry,
} from './types';
import {
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";

const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);

export class AttestationsStore {
  /** Private */
  private service : AttestationsService
  private profiles: ProfilesStore

  /** AttestationEh -> Attestation */
  private attestationsStore: Writable<Dictionary<Attestation>> = writable({});
  
  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  public attestations: Readable<Dictionary<Attestation>> = derived(this.attestationsStore, i => i)
  
  constructor(
    protected cellClient: CellClient,
  profilesStore: ProfilesStore,
  zomeName = 'hc_zome_attestations'
  ) {
    this.myAgentPubKey = serializeHash(cellClient.cellId[1]);
    this.profiles = profilesStore;
    this.service = new AttestationsService(cellClient, zomeName);

    cellClient.addSignalHandler( signal => {
      if (! areEqual(cellClient.cellId[0],signal.data.cellId[0]) || !areEqual(cellClient.cellId[1], signal.data.cellId[1])) {
        return
      }
      console.log("SIGNAL",signal)
      const payload = signal.data.payload
      switch(payload.message.type) {
      case "NewAttestation":
        if (!get(this.attestations)[payload.attestationHash]) {
          this.updateAttestationFromEntry(payload.attestationHash, payload.message.content)
        }
        break;
      }
    })
  }

  private others(): Array<AgentPubKeyB64> {
    return Object.keys(get(this.profiles.knownProfiles)).filter((key)=> key != this.myAgentPubKey)
  }

  async getProfile(agent: AgentPubKeyB64) : Promise<Profile|undefined> {
    return this.profiles.fetchAgentProfile(agent)
  }

  private async updateAttestationFromEntry(hash: EntryHashB64, entry: AttestationEntry): Promise<void>   {
    //console.log("updateAttestationFromEntry: " + hash)
    const attestation : Attestation = await this.service.attestationFromEntry(hash, entry)
    this.attestationsStore.update(attestations => {
      attestations[hash] = attestation
      return attestations
    })
  }

  async pullAttestations() : Promise<Dictionary<Attestation>> {
    const attestations = await this.service.getMyAttestations();
    //console.log({attestations})
    for (const s of attestations) {
      await this.updateAttestationFromEntry(s.hash, s.content)
    }
    return get(this.attestationsStore)
  }

  async addAttestation(attestation: Attestation) : Promise<EntryHashB64> {
    const s: AttestationEntry = {
      content: attestation.content,
      about: attestation.about,
      meta: attestation.meta,
    };
    const attestationEh: EntryHashB64 = await this.service.createAttestation(s)
    this.attestationsStore.update(attestations => {
      attestations[attestationEh] = attestation
      return attestations
    })
    this.service.notify({attestationHash:attestationEh, message: {type:"NewAttestation", content:s}}, this.others());
    return attestationEh
  }

  attestation(attestationEh: EntryHashB64): Attestation {
    return get(this.attestationsStore)[attestationEh];
  }
}
