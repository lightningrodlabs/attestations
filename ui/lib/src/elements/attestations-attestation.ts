import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@holochain-open-dev/context";
import {StoreSubscriber} from "lit-svelte-stores";
import {AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {sharedStyles} from "../sharedStyles";
import {Attestation, AttestationOutput, attestationsContext} from "../types";
import {AttestationsStore} from "../attestations.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext, AgentAvatar} from "@holochain-open-dev/profiles";
//import {Button, Dialog, TextField, Fab, Slider} from "@scoped-elements/material-web";

/**
 * @element attestations-attestation
 */
export class AttestationsAttestation extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() currentAttestationEh = "";
  @property() display = "full";

  @contextProvided({ context: attestationsContext })
  _store!: AttestationsStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _myAttestations = new StoreSubscriber(this, () => this._store.myAttestations);
  private _knownProfiles = new StoreSubscriber(this, () => this._profiles.knownProfiles);

  get myNickName(): string {
    return this._myProfile.value.nickname;
  }
  folk(agent: AgentPubKeyB64) {
    const profile = this._knownProfiles.value[agent]
    const folk = profile ? html`
      <li class="folk">
          <agent-avatar agent-pub-key="${agent}"></agent-avatar>
          <div>${profile.nickname}</div>
        </li>` :html`<agent-avatar agent-pub-key="${agent}"></agent-avatar>`
    return folk
  }
  render() {
    if (!this.currentAttestationEh) {
      return;
    }
    /** Get current attestation and zoom level */
    const attestationOutput: AttestationOutput = this._myAttestations.value[this.currentAttestationEh];
    const attestation = attestationOutput.content
    /** Render layout */

    switch (this.display) {
      case "compact":
        return html`${attestation.content} <agent-avatar agent-pub-key="${attestation.about}"></agent-avatar>`
        break;
      case "full":
      default:
        return html`
        <div class="row">
        <div><h4>Attesting: </h4>${attestation.content}</div> 
        <div class="about"><h4>About:</h4> ${this.folk(attestation.about)} </div>
        <div class="attesters">
          <h4>Attesters:</h4>
          <ul>
            ${attestationOutput.attesters.map((context) => {
              html`
                Who: ${this.folk(context.author)}
                When: ${context.timestamp}
                Verifialbe: ${context.verifiable}
              `
            })}
          </ul>
        </div>
        </div>
      `;          
    }
  }


  static get scopedElements() {
    return {
      'agent-avatar': AgentAvatar
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        .folk {
          list-style: none;
          margin: 2px;
        }
        div {
          padding: 5px;
        }
      `,
    ];
  }
}
