import { css, html, LitElement } from "lit";
import { property, query, state } from "lit/decorators.js";

import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { sharedStyles } from "../sharedStyles";
import { CopyableContent } from "./copiable-content";
import {
  AgentAvatar,
  ProfilesStore,
  profilesStoreContext,
  Profile
} from "@holochain-open-dev/profiles";
import { TaskSubscriber } from "lit-svelte-stores";
import { AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import { deserializeHash } from "@holochain-open-dev/utils";
import { writable, Writable, derived, Readable, get } from 'svelte/store';
import { contextProvided } from "@lit-labs/context";

export class AttestationFolk extends ScopedElementsMixin(LitElement) {
  @property() agent: AgentPubKeyB64 = "";
  @property() showNick: boolean = true
  @property() showCopiable: boolean = true
  @property() compact: boolean = false
  @contextProvided({ context: profilesStoreContext })
  @property({ type: Object })
  _profiles!: ProfilesStore;
  
  _profileTask = new TaskSubscriber(
    this,
    () => this._profiles.fetchAgentProfile(deserializeHash(this.agent)),
    () => [this._profiles, this.agent]
  );

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

  renderProfile(profile: Profile | undefined) {
    if (!profile) return "";
    return html`
        ${!this.compact? html`<div class="folk">`:""}
          <agent-avatar .agentPubKey=${deserializeHash(this.agent)}></agent-avatar>
          ${this.showNick ? html`<div>${profile.nickname}</div>`:""}
          ${this.showCopiable ? html`<copiable-content .content=${this.agent} ></copiable-content>`:""}          
        ${!this.compact? html`</div>`:""}`
  }

  render() {
    return this._profileTask.render({
      complete: profile => this.renderProfile(profile),
      pending: () => html`Loading...`,
    });


  }
  static get scopedElements() {
    return {
      "agent-avatar": AgentAvatar,
      "copiable-content": CopyableContent,
    };
  }
}
