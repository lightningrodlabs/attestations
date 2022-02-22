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
import { AttestationFolk } from "./attestation-folk";
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

  folk(agent: AgentPubKeyB64) {
    return html`<attestation-folk .agent=${agent}></attestation-folk>`
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
        return html`${attestation.content} <attestation-folk .agent=${attestation.about} .compact=${true} .showNick=${false} .showCopiable=${false}></attestation-folk></agent-avatar>`
        break;
      case "compact-with-who":
        const who = this.attestationOutput.attesters.map((a)=> 
          html`<attestation-folk .agent=${a.author} .compact=${true} .showNick=${false} .showCopiable=${false}></attestation-folk></agent-avatar>`)
        return html`${who} ${attestation.content} <agent-avatar agent-pub-key="${attestation.about}"></agent-avatar>`
        break;
      case "full":
        return html`
        <div class="column">
          <div class="row">
        <div><h4>Attesting: </h4>${attestation.content}</div> 
        <div class="about"><h4>About:</h4> <attestation-folk .agent=${attestation.about}></attestation-folk></div>
    </div>
        <div class="attesters">
          <h4>Attesters:  ${this.attestationOutput.attesters.length}</h4>
          <ul class="column">
            ${this.attestationOutput.attesters.map((attester) => {
              const date = new Date(attester.timestamp/1000)
              return html`
                <div class="row">
                <div> Who: <attestation-folk .agent=${attester.author}></attestation-folk></div>
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
      'attestation-folk': AttestationFolk
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        div {
          padding: 5px;
        }
      `,
    ];
  }
}
