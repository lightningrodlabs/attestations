import { EntryHashB64, HeaderHashB64, AgentPubKeyB64, serializeHash } from '@holochain-open-dev/core-types';
import { CellClient } from '@holochain-open-dev/cell-client';
import { writable, Writable, derived, Readable, get } from 'svelte/store';

import { AttestationsService } from './attestations.service';
import {
  Dictionary,
  Attestation,
  AttestationOutput,
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
  private attestationsStore: Writable<Dictionary<AttestationOutput>> = writable({});
  
  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  public attestations: Readable<Dictionary<AttestationOutput>> = derived(this.attestationsStore, i => i)
  
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
      case "":
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

  async pullAttestations() : Promise<Dictionary<AttestationOutput>> {
    const attestationsOutputs = await this.service.getMyAttestations();
    //console.log({attestations})
    for (const a of attestationsOutputs) {
      this.attestationsStore.update(attestations => {
        attestations[a.hash] = a
        return attestations
      })
    }
    return get(this.attestationsStore)
  }

  async addAttestation(attestation: Attestation) : Promise<EntryHashB64> {
    const s: Attestation = {
      content: attestation.content,
      about: attestation.about,
    };
    const attestationEh: EntryHashB64 = await this.service.createAttestation(s)
    await this.pullAttestations()
    return attestationEh
  }

  attestation(attestationEh: EntryHashB64): AttestationOutput {
    return get(this.attestationsStore)[attestationEh];
  }
}
