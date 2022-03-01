import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@holochain-open-dev/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {AttestationsStore} from "../attestations.store";
import {Attestation, attestationsContext, CreateNonceInput, FulfillNonceInput} from "../types";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {
  Button,
  Dialog,
  TextField
} from "@scoped-elements/material-web";
import {Profile, SearchAgent, AgentAvatar} from "@holochain-open-dev/profiles";

export enum DialogType {
  Attestation,
  CreateNonce,
  FulfilNonce,
}

/**
 * @element attestations-attestation-dialog
 */
export class AttestationsAttestationDialog extends ScopedElementsMixin(LitElement) {

  @property() myProfile: Profile| undefined = undefined;
  @property() type: DialogType = DialogType.Attestation;

  /** Dependencies */
  @contextProvided({ context: attestationsContext })
  _store!: AttestationsStore;

  _attestationToPreload?: EntryHashB64;

  @query('#content-field')
  _contentField!: TextField;

  @state() _about: AgentPubKeyB64 = ""
  @state() _profile: Profile | undefined = undefined

  dialogTitle(): string {
    switch (this.type) {
      case DialogType.Attestation: return "New Attestation"
      case DialogType.FulfilNonce: return "Fulfill Nonce"
      case DialogType.CreateNonce: return "Create Nonce"
    }
  }

  agentFieldTitle(): string {
    switch (this.type) {
      case DialogType.Attestation: return "About"
      case DialogType.FulfilNonce: return "With"
      case DialogType.CreateNonce: return "For"
    }
  }

  conentFieldTitle(): string {
    switch (this.type) {
      case DialogType.Attestation: return "Content"
      case DialogType.FulfilNonce: return "Nonce"
      case DialogType.CreateNonce: return "Notes"
    }
  }

  /**
   *
   */
  open(type: DialogType) {
    this.type = type 
    this.requestUpdate();
    const dialog = this.shadowRoot!.getElementById("attestation-dialog") as Dialog
    dialog.open = true
  }

  /**
   *
   */
  private async handleOk(e: any) {
    /** Check validity */

    let isValid = true;
    if (this.type != DialogType.CreateNonce) {
      // contentField
      isValid = this._contentField.validity.valid

      if (!this._contentField.validity.valid) {
        this._contentField.reportValidity()
      }
    }
    if (!isValid) return
    if (!this._about) {
      return
    }

    switch (this.type) {
      case DialogType.Attestation:
        const attestation: Attestation = {
          content: this._contentField.value,
          about: this._about,
        };
          // - Add attestation
        const newAttestation = await this._store.addAttestation(attestation);
        this.dispatchEvent(new CustomEvent('attestation-added', { detail: newAttestation, bubbles: true, composed: true }));       
        break;
      case DialogType.CreateNonce:
        const input: CreateNonceInput = {
          note: this._contentField.value,
          with: this._about,
        };
        const nonce = await this._store.createNonce(input);
        alert(nonce)
        break;
      case DialogType.FulfilNonce:
        const fulfill: FulfillNonceInput = {
          nonce: parseInt(this._contentField.value),
          with: this._about,
        };
        const result = await this._store.fulfillNonce(fulfill);
        break;
      
    }


    // - Clear all fields
    // this.resetAllFields();
    // - Close dialog
    const dialog = this.shadowRoot!.getElementById("attestation-dialog") as Dialog;
    dialog.close()
  }

  resetAllFields() {
    if (this._contentField) {
      this._contentField.value = ''
    }
    this._about = ""
  }

  private async handleDialogOpened(e: any) {
    if (this._attestationToPreload) {
      const attestationOutput = this._store.attestation(this._attestationToPreload);
      if (attestationOutput) {
        const attestation = attestationOutput.content
        this._contentField.value = attestation.content;
      }
      this._attestationToPreload = undefined;
    }
    this.requestUpdate()
  }

  private async handleDialogClosing(e: any) {
    this.resetAllFields();
  }

  private async setAbout(e:any) {
    console.log("E", e.detail.agentPubKey)
    this._about = e.detail.agentPubKey
    this._profile = await this._store.getProfile(this._about)
//    this.requestUpdate()
  }

  render() {
    const about = this._profile && this._about ? html`
    <li class="folk">
        <agent-avatar agent-pub-key="${this._about}"></agent-avatar>
          <div>${this._profile.nickname}</div>
        </li>` :""
    return html`
<mwc-dialog id="attestation-dialog" heading=${this.dialogTitle()} @closing=${this.handleDialogClosing} @opened=${this.handleDialogOpened}>
  
  <mwc-textfield dialogInitialFocus type="text"
    @input=${() => (this.shadowRoot!.getElementById("content-field") as TextField).reportValidity()}
    id="content-field" minlength="3" maxlength="64" label=${this.conentFieldTitle()} autoValidate=true required></mwc-textfield>

  ${this.agentFieldTitle()} : ${about}
  <search-agent
  @closing=${(e:any)=>e.stopPropagation()}
  @agent-selected="${this.setAbout}"
  clear-on-select
  style="margin-bottom: 16px;"
  include-myself></search-agent>

  <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
  <mwc-button slot="secondaryAction"  dialogAction="cancel">cancel</mwc-button>
</mwc-dialog>
`
  }


  static get scopedElements() {
    return {
      "mwc-button": Button,
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "search-agent": SearchAgent,
      'agent-avatar': AgentAvatar,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-dialog div {
          display: flex;
        }
        #attestation-dialog {
          --mdc-dialog-min-width: 600px;
        }
        mwc-textfield {
          margin-top: 10px;
          display: flex;
        }
        .ui-item {
          position: absolute;
          pointer-events: none;
          text-align: center;
          flex-shrink: 0;
        }
        .folk {
          list-style: none;
          margin: 2px;
        }

        .folk > img {
          width: 50px;
          border-radius: 10000px;
        }
`,
    ];
  }
}
