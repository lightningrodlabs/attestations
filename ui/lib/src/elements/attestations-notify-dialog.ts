import {css, html, LitElement} from "lit";
import {property, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@holochain-open-dev/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {
  Button,
  Dialog,
} from "@scoped-elements/material-web";

/**
 * @element attestations-attestation-dialog
 */
export class AttestationsNotifyDialog extends ScopedElementsMixin(LitElement) {
    @property() title: string = "";
    @property() notification: string = "";

    /**
   *
   */
    open() {
        this.requestUpdate();
        const dialog = this.shadowRoot!.getElementById("notify-dialog") as Dialog
        dialog.open = true
    }
    render() {
        return html`
          <mwc-dialog
            id="notify-dialog"
            heading=${this.title}
          >
            <div>${this.notification}</div>
            <mwc-button id="primary-action-button" dialogAction="cancel">ok</mwc-button
            >
          </mwc-dialog>
        `;
      }
    
    
      static get scopedElements() {
        return {
          "mwc-button": Button,
          "mwc-dialog": Dialog,
        };
      }
      static get styles() {
        return [
          sharedStyles,
          css`
            #notify-dialog {
              --mdc-dialog-min-width: 600px;
            }
    `,
        ];
      }
    }
    