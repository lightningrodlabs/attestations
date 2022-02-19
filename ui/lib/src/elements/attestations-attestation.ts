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
import { SlRelativeTime } from "@scoped-elements/shoelace";
import { CopyableContent } from "./copiable-content";
//import {Button, Dialog, TextField, Fab, Slider} from "@scoped-elements/material-web";

/**
 * @element attestations-attestation
 */
export class AttestationsAttestation extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property({type: Object}) attestationOutput!: AttestationOutput;
  @property() display = "full";

  @contextProvided({ context: attestationsContext })
  _store!: AttestationsStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  private _knownProfiles = new StoreSubscriber(this, () => this._profiles.knownProfiles);

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
    if (!this.attestationOutput) {
      return html`nothing`
//      return;
    } 
    /** Get current attestation and zoom level */
    const attestation = this.attestationOutput.content
    /** Render layout */
    switch (this.display) {
      case "compact":
        return html`${attestation.content} <agent-avatar agent-pub-key="${attestation.about}"></agent-avatar>`
        break;
      case "full":
        return html`
        <div class="row">
        <div class="attesters">
          <h4>Attesters:  ${this.attestationOutput.attesters.length}</h4>
          <ul class="column">
            ${this.attestationOutput.attesters.map((context) => {
              const date = new Date(context.timestamp/1000)
              return html`
                <div> Who: ${this.folk(context.author)} <copiable-content .content=${attestation.about} ></copiable-content></div>
                <div class="column">
                <div>When: <sl-relative-time .date=${date}></sl-relative-time></div>
                <div>Verifiable: <copiable-content .content=${context.verifiable}></copiable-content></div>
                </div>
              `
            })}
          </ul>
        </div>
        <div><h4>Attesting: </h4>${attestation.content}</div> 
        <div class="about"><h4>About:</h4> ${this.folk(attestation.about)} <copiable-content .content=${attestation.about} ></copiable-content></div>
        </div>
      `;          
    }
  }


  static get scopedElements() {
    return {
      'agent-avatar': AgentAvatar,
      'sl-relative-time': SlRelativeTime,
      'copiable-content': CopyableContent,
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
