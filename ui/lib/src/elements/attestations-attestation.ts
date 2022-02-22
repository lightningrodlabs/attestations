import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@holochain-open-dev/context";
import {StoreSubscriber} from "lit-svelte-stores";
import {AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {sharedStyles} from "../sharedStyles";
import {Attestation, AttestationOutput, attestationsContext, Verifiable} from "../types";
import {AttestationsStore} from "../attestations.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext, AgentAvatar} from "@holochain-open-dev/profiles";
import { SlRelativeTime } from "@scoped-elements/shoelace";
import { CopyableContent } from "./copiable-content";
import {encode} from "@msgpack/msgpack"
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
      return html``
    } 
    /** Get current attestation and zoom level */
    const attestation = this.attestationOutput.content
    /** Render layout */
    switch (this.display) {
      case "compact":
        return html`${attestation.content} <agent-avatar agent-pub-key="${attestation.about}"></agent-avatar>`
        break;
      case "compact-with-who":
        const who = this.attestationOutput.attesters.map((a)=> html`<agent-avatar agent-pub-key="${a.author}"></agent-avatar>`)
        return html`${who} ${attestation.content} <agent-avatar agent-pub-key="${attestation.about}"></agent-avatar>`
        break;
      case "full":
        return html`
        <div class="column">
          <div class="row">
        <div><h4>Attesting: </h4>${attestation.content}</div> 
        <div class="about"><h4>About:</h4> ${this.folk(attestation.about)} <copiable-content .content=${attestation.about} ></copiable-content></div>
    </div>
        <div class="attesters">
          <h4>Attesters:  ${this.attestationOutput.attesters.length}</h4>
          <ul class="column">
            ${this.attestationOutput.attesters.map((context) => {
              const date = new Date(context.timestamp/1000)
              return html`
                <div class="row">
                <div> Who: ${this.folk(context.author)} <copiable-content .content=${attestation.about} ></copiable-content></div>
                <div>When: <sl-relative-time .date=${date}></sl-relative-time></div>
                <div>Bare Verifiable: <copiable-content .content=${encode(this.attestationOutput.verifiable)}></copiable-content></div>
                <div>Full Verifiable: <copiable-content .content=${
                encode({
                  signedHeaders: this.attestationOutput.verifiable.signedHeaders, attestation: this.attestationOutput.content})}></copiable-content></div>
                </div>
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
