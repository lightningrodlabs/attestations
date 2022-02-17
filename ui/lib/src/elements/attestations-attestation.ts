import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@holochain-open-dev/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {Attestation, attestationsContext} from "../types";
import {AttestationsStore} from "../attestations.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext,} from "@holochain-open-dev/profiles";
//import {Button, Dialog, TextField, Fab, Slider} from "@scoped-elements/material-web";
import { SlAvatar } from '@scoped-elements/shoelace';

/**
 * @element attestations-attestation
 */
export class AttestationsAttestation extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() currentAttestationEh = "";

  @contextProvided({ context: attestationsContext })
  _store!: AttestationsStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _attestations = new StoreSubscriber(this, () => this._store.attestations);
  private _knownProfiles = new StoreSubscriber(this, () => this._profiles.knownProfiles);

  get myNickName(): string {
    return this._myProfile.value.nickname;
  }

  render() {
    if (!this.currentAttestationEh) {
      return;
    }
    /** Get current attestation and zoom level */
    const attestation: Attestation = this._attestations.value[this.currentAttestationEh];
    /** Render layout */

    const profile = this._knownProfiles.value[attestation.about]
    const folk = profile ? html`
    <li class="folk">
          <sl-avatar .image=${profile.fields.avatar}></sl-avatar>
          <div>${profile.nickname}</div>
        </li>` :""

    return html`
      <div class="row">
      <div>Attesting: ${attestation.content}</div> 
      <div class="about">About: ${folk}</div>
      </div>
    `;
  }


  static get scopedElements() {
    return {
      'sl-avatar': SlAvatar,
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
