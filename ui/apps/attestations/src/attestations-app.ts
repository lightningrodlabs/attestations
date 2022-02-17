import { ContextProvider } from "@holochain-open-dev/context";
import { state } from "lit/decorators.js";
import {
  AttestationsController,
  AttestationsAttestation,
  AttestationsStore,
  attestationsContext,
} from "@attestations/elements";
import {
  ProfilePrompt,
  ProfilesStore,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import { HolochainClient } from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";

export class AttestationsApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  async firstUpdated() {
    
    const client = await HolochainClient.connect(`ws://localhost:${process.env.HC_PORT}`, "attestations");

    const attestationsClient = client.forCell(
      client.cellDataByRoleId('attestations')!
    );

    const store = new ProfilesStore(attestationsClient, {avatarMode: "avatar"})

    store.fetchAllProfiles()

    new ContextProvider(
      this,
      profilesStoreContext,
      store
    );

    new ContextProvider(this, attestationsContext, new AttestationsStore(attestationsClient, store));

    this.loaded = true;
  }


  render() {
    if (!this.loaded) return html`<span>Loading...</span>`;
    return html`
        <profile-prompt></profile-prompt>
        <attestations-controller></attestations-controller>
<!--      <attestations-controller dummy></attestations-controller>-->
    `;
  }

  static get scopedElements() {
    return {
      "profile-prompt": ProfilePrompt,
      "attestations-controller": AttestationsController,
      "attestations-attestation": AttestationsAttestation,
    };
  }
}
