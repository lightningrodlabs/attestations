import { ContextProvider } from "@lit-labs/context";
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
  ProfilesService,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import { HolochainClient, CellClient } from "@holochain-open-dev/cell-client";
import { RoleId, AppWebsocket } from "@holochain/client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";

export class AttestationsApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  @state()
  store: ProfilesStore | undefined;

  async firstUpdated() {
    const appWebsocket = await AppWebsocket.connect(
      `ws://localhost:${process.env.HC_PORT}`
    );

    const client = new HolochainClient(appWebsocket);
    const appInfo = await appWebsocket.appInfo({
      installed_app_id: "attestations",
    });

    const cell = appInfo.cell_data[0];
    const attestationsClient = new CellClient(client, cell);

    this.store = new ProfilesStore(new ProfilesService(attestationsClient), {
      avatarMode: "identicon",
    });

    this.store.fetchAllProfiles();

    new ContextProvider(this, profilesStoreContext, this.store);

    new ContextProvider(
      this,
      attestationsContext,
      new AttestationsStore(attestationsClient, this.store)
    );

    this.loaded = true;
  }

  render() {
    if (!this.loaded) return html`<span>Loading...</span>`;
    return html`
      <profile-prompt>
        <attestations-controller></attestations-controller>
      </profile-prompt>
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
