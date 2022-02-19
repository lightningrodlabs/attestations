import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';
import { IconButton } from '@scoped-elements/material-web';
import { Snackbar } from '@scoped-elements/material-web';
import { sharedStyles } from '../sharedStyles';
import { Base64 } from "js-base64";

export class CopyableContent extends ScopedElementsMixin(LitElement) {
  @property()
  content!: Uint8Array | string;

  @property({ type: Number })
  sliceLength: number = 8;

  @query('#copy-notification')
  _copyNotification!: Snackbar;

  get strContent() {
    return typeof this.content === 'string' ? this.content : Base64.fromUint8Array(this.content, true);
  }

  async copyContent() {
    await navigator.clipboard.writeText(this.strContent);
    this._copyNotification.show();
  }

  render() {
    return html`
      <mwc-snackbar
        id="copy-notification"
        labelText="Content copied to clipboard"
      ></mwc-snackbar>
      <div class="row center-content">
        <span style="font-family: monospace;"
          >${this.strContent.substring(0, this.sliceLength)}...</span
        >
        <mwc-icon-button
          style="--mdc-icon-button-size	: 24px; --mdc-icon-size: 20px;"
          icon="content_copy"
          @click=${() => this.copyContent()}
        ></mwc-icon-button>
      </div>
    `;
  }

  static get styles() {
    return sharedStyles;
  }

  static get scopedElements() {
    return {
      'mwc-icon-button': IconButton,
      'mwc-snackbar': Snackbar,
    };
  }
}
