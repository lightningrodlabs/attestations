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
  ProfilesService,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import { HolochainClient, CellClient } from "@holochain-open-dev/cell-client";
import { RoleId, AppWebsocket } from "@holochain/client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";

async function setupClient() {
  const appWebsocket = await AppWebsocket.connect(
    `ws://localhost:${process.env.HC_PORT}`
  );

  const client = new HolochainClient(appWebsocket);

  return client;
}

async function setupProfilesStore() {
  const appWs = await AppWebsocket.connect(
    `ws://localhost:${process.env.HC_PORT}`
  );

  const appInfo = await appWs.appInfo({
    installed_app_id: "attestations",
  });
  const cell = appInfo.cell_data.find((c) => c.role_id === "attestations");

  const client = new HolochainClient(appWs);

  const cellClient = new CellClient(client, cell!);

  const profilesStore = new ProfilesStore(new ProfilesService(cellClient), {
    avatarMode: "avatar-optional",
  });
  return profilesStore;
}


export class AttestationsApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  async firstUpdated() {
    
    const client = await setupClient()
    //HolochainClient.connect(`ws://localhost:${process.env.HC_PORT}`, "attestations");

    const attestationsClient = client.forCell(
      client.cellDataByRoleId('attestations')!
    );

    const store = new ProfilesStore(attestationsClient, {avatarMode: "identicon"})

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
