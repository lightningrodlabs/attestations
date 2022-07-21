import { css, html, LitElement } from "lit";
import { property, query, state } from "lit/decorators.js";

import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { sharedStyles } from "../sharedStyles";
import { CopyableContent } from "./copiable-content";
import {
  AgentAvatar,
  ProfilesStore,
} from "@holochain-open-dev/profiles";
import { StoreSubscriber } from "lit-svelte-stores";
import { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

export class AttestationFolk extends ScopedElementsMixin(LitElement) {
  @property() agent: AgentPubKeyB64 = "";
  @property() showNick: boolean = true
  @property() showCopiable: boolean = true
  @property() compact: boolean = false
  _profiles!: ProfilesStore;

  /*
  private _knownProfiles = new StoreSubscriber(
    this,
    () => this._profiles.knownProfiles
  );*/

  static get styles() {
    return [
      sharedStyles,
      css`
        .folk {
          margin: 0px;
        }
      `,
    ];
  }
  render() {
    const profile = {nickname:"fish"} // FIXME this._knownProfiles.value[this.agent];
    const showNick = this.showNick && profile
    return html`
        ${!this.compact? html`<div class="folk">`:""}
          <agent-avatar agent-pub-key="${this.agent}"></agent-avatar>
          ${showNick ? html`<div>${profile.nickname}</div>`:""}
          ${this.showCopiable ? html`<copiable-content .content=${this.agent} ></copiable-content>`:""}          
        ${!this.compact? html`</div>`:""}`
  }
  static get scopedElements() {
    return {
      "agent-avatar": AgentAvatar,
      "copiable-content": CopyableContent,
    };
  }
}
