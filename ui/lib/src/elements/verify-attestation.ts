import { css, html, LitElement } from "lit";
import { property, query, state } from "lit/decorators.js";

import { contextProvided } from "@holochain-open-dev/context";
import { IconButton, TextArea } from "@scoped-elements/material-web";
import { AttestationsAttestation } from "./attestations-attestation";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { sharedStyles } from "../sharedStyles";
import { Attestation, attestationsContext, Verifiable } from "../types";
import { AttestationsStore } from "../attestations.store";
import { Base64 } from "js-base64";
import { decode } from "@msgpack/msgpack";

export class VerifyAttestation extends ScopedElementsMixin(LitElement) {
  @query("#verifiable-field")
  _verifiable!: TextArea;

  @state()
  _attestation: Attestation | undefined;
  @state()
  _verified: boolean = false
  @state()
  _verificationError: string = ""

  @contextProvided({ context: attestationsContext })
  _store!: AttestationsStore;

  static get styles() {
    return sharedStyles;
  }
  async check() {
    this._verificationError = ""
    try {
      const verifiable: Verifiable = decode(
        Base64.toUint8Array(this._verifiable.value)
      ) as Verifiable;
      if (verifiable.attestation) {
        this._attestation = verifiable.attestation;
      } else {
        this._attestation = undefined;
      }
      this._verified = await this._store.verify(verifiable);
    } catch (e) {
        this._verified = false
        this._verificationError = JSON.stringify(e)
    }
  }
  render() {
    return html`
      <mwc-textarea
        autoValidate="true"
        @input=${this.check}
        id="verifiable-field"
        cols="40"
        rows="10"
        label="Verifiable"
        required
      ></mwc-textarea>
      ${this._verifiable && this._verifiable.value != "" ? (this._verified ? html`<h2>Verified</h2>` : html`<h2>Verification Failed!</h2>`) : ""}
      ${this._attestation
        ? html`
            Content: ${this._attestation.content} 
            About: ${this._attestation.about}`
        : ""}
    `;
  }
  static get scopedElements() {
    return {
      "mwc-icon-button": IconButton,
      "mwc-textarea": TextArea,
      "attestations-attestation": AttestationsAttestation,
    };
  }
}
