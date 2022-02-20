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

  @contextProvided({ context: attestationsContext })
  _store!: AttestationsStore;

  static get styles() {
    return sharedStyles;
  }
  async check() {
    try {
      const verifiable: Verifiable = decode(
        Base64.toUint8Array(this._verifiable.value)
      ) as Verifiable;
      const verified = await this._store.verify(verifiable);
      if (verified) {
        this._attestation = verifiable.attestation;
        return;
      }
    } catch (e) {}
    this._attestation = undefined;
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
      ${this._attestation
        ? html` <h2>VERFIED:</h2>
            Content: ${this._attestation.content} About:
            ${this._attestation.about}`
        : html`<h2>UNVERIFIED</h2>`}
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
