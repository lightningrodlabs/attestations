import { html, css, LitElement } from "lit";
import { state, property, query } from "lit/decorators.js";

import { contextProvided } from "@holochain-open-dev/context";
import { StoreSubscriber } from "lit-svelte-stores";
import { Unsubscriber } from "svelte/store";

import { sharedStyles } from "../sharedStyles";
import {attestationsContext, Attestation, AttestationOutput, Dictionary, Signal} from "../types";
import { AttestationsStore } from "../attestations.store";
import { AttestationsAttestation } from "./attestations-attestation";
import { AttestationsAttestationDialog } from "./attestations-attestation-dialog";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, TopAppBar, Drawer, List, Icon, Switch, Formfield, Menu,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore,
  Profile,
  AgentAvatar
} from "@holochain-open-dev/profiles";
import {EntryHashB64} from "@holochain-open-dev/core-types";

/**
 * @element attestations-controller
 */
export class AttestationsController extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'dummy' })
  canLoadDummy = false;

  /** Dependencies */

  @contextProvided({ context: attestationsContext })
  _store!: AttestationsStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _myAttestations = new StoreSubscriber(this, () => this._store.myAttestations);
  _searchAttestations = new StoreSubscriber(this, () => this._store.searchedAttestations);

  
  /** Private properties */

  @query('#search-field')
  _searchField!: TextField;
  @query('#search-button')
  _searchButton!: Button;
  @query("#attestations-attestation")
  _attestationElem!: AttestationsAttestation

  @query('#my-drawer')
  private _drawer!: Drawer;

  @state() _currentAttestationEh = "";
  @state() _currentAttestationOutput! : AttestationOutput;
  @state() noneFound = false;

  private initialized = false;
  private initializing = false;


  async createDummyProfile() {
    const nickname = "Cam";
    const avatar = "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png";

    try {
      const fields: Dictionary<string> = {};
       if (avatar) {
         fields['avatar'] = avatar;
       }
      await this._profiles.createProfile({
        nickname,
        fields,
      });

    } catch (e) {
      //this._existingUsernames[nickname] = true;
      //this._nicknameField.reportValidity();
    }
  }


  get myNickName(): string {
    return this._myProfile.value.nickname;
  }
  get myAvatar(): string {
    return this._myProfile.value.fields.avatar;
  }

  private subscribeProfile() {
    let unsubscribe: Unsubscriber;
    unsubscribe = this._profiles.myProfile.subscribe(async (profile) => {
      if (profile) {
        await this.checkInit();
      }
      // unsubscribe()
    });
  }

  async firstUpdated() {
    if (this.canLoadDummy) {
      await this.createDummyProfile()
    }
    this.subscribeProfile()
  }
 
  private _getFirst(attestations: Dictionary<AttestationOutput>): EntryHashB64 {
    if (Object.keys(attestations).length == 0) {
      return "";
    }
    for (let attestationEh in attestations) {
//      const attestation = attestations[attestationEh]
//      if (attestation.visible) {
        return attestationEh
//      }
    }
    return "";
  }

  async checkInit() {
    if (this.initialized || this.initializing) {
      this.initialized = true;
      return;
    }
    this.initializing = true  // because checkInit gets call whenever profiles changes...
    let attestations = await this._store.pullMyAttestations();

    /** load up a attestation if there are none */
    if (Object.keys(attestations).length == 0) {
      console.log("no attestations found, initializing")
      await this.addHardcodedAttestations();
      attestations = await this._store.pullMyAttestations();
    }
    if (Object.keys(attestations).length == 0) {
      console.error("No attestations found")
    }
    this._currentAttestationEh = this._getFirst(attestations);

    console.log("   current attestation: ",  attestations[this._currentAttestationEh].content, this._currentAttestationEh);

    // request the update so the drawer will be findable
    await this.requestUpdate();

    /** Drawer */
    if (this._drawer) {
      const container = this._drawer.parentNode!;
      container.addEventListener('MDCTopAppBar:nav', () => {
        this._drawer.open = !this._drawer.open;
      });
    }
    /** Menu */
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    const button = this.shadowRoot!.getElementById("menu-button") as IconButton;
    menu.anchor = button
    // - Done
    this.initializing = false
    this.initialized = true
  }

  async addHardcodedAttestations() {
 
    /** Attestations */
    await this._store.addAttestation({
      content: "I exist!",
      about: this._store.myAgentPubKey,
    });
  }

  async refresh() {
    console.log("refresh: Pulling data from DHT")
    await this._store.pullMyAttestations();
    await this._profiles.fetchAllProfiles()
  }

  async openAttestationDialog(attestation?: any) {
    this.attestationDialogElem.resetAllFields();
    this.attestationDialogElem.open(attestation);
  }

  get attestationDialogElem() : AttestationsAttestationDialog {
    return this.shadowRoot!.getElementById("attestation-dialog") as AttestationsAttestationDialog;
  }

  private async handleAttestationSelected(e: any): Promise<void> {
    const index = e.detail.index;
    const attestationList = this.shadowRoot!.getElementById("attestations-list") as List;
    const value = attestationList.items[index].value;
    console.log("attestation value: " + value);
    this.handleAttestationSelect(value);
  }

  private async handleAttestationSelect(attestationEh: string): Promise<void> {
    this._currentAttestationEh = attestationEh;
    this._currentAttestationOutput =  this._myAttestations.value[attestationEh];
  }

  openTopMenu() {
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    menu.open = true;
  }

  handleMenuSelect(e: any) {
    console.log("handleMenuSelect: " + e.originalTarget.innerHTML)
    //console.log({e})
    switch (e.originalTarget.innerHTML) {
      case "Duplicate Attestation":
        this.openAttestationDialog(this._currentAttestationEh)
        break;
      default:
        break;
    }
  }
  async search() {
    const result = await this._store.searchAttestations(this._searchField.value)
    console.log("FISH",Object.keys(result).length)
    this.noneFound = Object.keys(result).length == 0
  }

  makeMyAttestationList(entries: Dictionary<AttestationOutput>, display: string) {
    return Object.entries(entries).map(
      ([key, attestationOutput]) => {
        const attestation = attestationOutput.content
        return html`
          <mwc-list-item class="attestation-li" .selected=${key == this._currentAttestationEh} value="${key}">
          <attestations-attestation id="attestations-attestation" .attestationOutput=${attestationOutput} .display=${display}></attestations-attestation>
          </mwc-list-item>
          `
      })
  }


  makeAttestationList(entries: Dictionary<AttestationOutput>, display: string) {
    return Object.entries(entries).map(
      ([key, attestationOutput]) => {
        const attestation = attestationOutput.content
        return html`
          <li class="attestation-li" value="${key}">
          <attestations-attestation id="attestations-attestation" .attestationOutput=${attestationOutput} .display=${display}></attestations-attestation>
          </li>
          `
      })
  }

  render() {
    if (!this._currentAttestationEh) {
      return;
    }

    /** Build attestation list */
    const attestations = this.makeMyAttestationList(this._myAttestations.value, "compact") 
    const searched = this.makeAttestationList(this._searchAttestations.value, "full") 
    
    return html`
<!--  DRAWER -->
<mwc-drawer type="dismissible" id="my-drawer">
  <div>
    <mwc-list>
    <mwc-list-item twoline graphic="avatar" noninteractive>
      <span>${this.myNickName}</span>
      <span slot="secondary">${this._profiles.myAgentPubKey}</span>
      <agent-avatar size=50 slot="graphic" .agentPubKey=${this._profiles.myAgentPubKey}></agent-avatar>
    </mwc-list-item>
    <li divider role="separator"></li>
    </mwc-list>
    <mwc-button icon="add_circle" @click=${() => this.openAttestationDialog()}>Attestation</mwc-button>

    <!-- Attestation List -->
    <mwc-list id="attestations-list" activatable @selected=${this.handleAttestationSelected}>
      ${attestations}
    </mwc-list>

  </div>
<!-- END DRAWER -->

  <div slot="appContent">
    <!-- TOP APP BAR -->
    <mwc-top-app-bar id="app-bar" dense style="position: relative;">
      <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
      <div slot="title">Attestations - ${this._attestationElem ? this._attestationElem.attestationOutput.content.content : "nothing"}</div>
      <mwc-icon-button slot="actionItems" icon="autorenew" @click=${() => this.refresh()} ></mwc-icon-button>
      <mwc-icon-button id="menu-button" slot="actionItems" icon="more_vert" @click=${() => this.openTopMenu()}></mwc-icon-button>
      <mwc-menu id="top-menu" @click=${this.handleMenuSelect}>
        <mwc-list-item graphic="icon" value="fork_attestation"><span>Duplicate Attestation</span><mwc-icon slot="graphic">edit</mwc-icon></mwc-list-item>
      </mwc-menu>
    </mwc-top-app-bar>

    <div class="appBody row">
      <div id="search-area" class="column">
        <div class="search-controls">
          <mwc-textfield id="search-field" width="200" type="text" label="search" @input=${() => this._searchButton.disabled = !Boolean(this._searchField.value)}></mwc-textfield>    
          <mwc-button id="search-button" icon="search" @click=${async () => this.search()} disabled></mwc-button>
        </div>
        <div class="search-results">
          ${this.noneFound ? "Nothing found" : html`    
          <ul id="searched-attestations-list" >
            ${searched}
          </ul>`}
        </div>
      </div>
      <attestations-attestation id="attestations-attestation" .attestationOutput=${this._currentAttestationOutput}></attestations-attestation>
    </div>

    <attestations-attestation-dialog id="attestation-dialog"
                        .myProfile=${this._myProfile.value}
                        @attestation-added=${(e:any) => this._currentAttestationEh = e.detail}>
    </attestations-attestation-dialog>
  </div>
</mwc-drawer>
`;
  }


  static get scopedElements() {
    return {
      "mwc-menu": Menu,
      "mwc-switch": Switch,
      "mwc-drawer": Drawer,
      "mwc-top-app-bar": TopAppBar,
      "mwc-textfield": TextField,
      "mwc-select": Select,
      "mwc-list": List,
      "mwc-list-item": ListItem,
      "mwc-icon": Icon,
      "mwc-icon-button": IconButton,
      "mwc-button": Button,
      "attestations-attestation-dialog" : AttestationsAttestationDialog,
      "attestations-attestation": AttestationsAttestation,
      "mwc-formfield": Formfield,
      'agent-avatar': AgentAvatar,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          margin: 10px;
        }

        .mdc-drawer__header {
          display:none;
        }

        mwc-top-app-bar {
          /**--mdc-theme-primary: #00ffbb;*/
          /**--mdc-theme-on-primary: black;*/
        }

        #app-bar {
          /*margin-top: -15px;*/
        }

        #my-drawer {
          margin-top: -15px;
        }

        .appBody {
          width: 100%;
          margin-top: 2px;
          display:flex;
        }

        .folk {
          list-style: none;
          margin: 2px;
          text-align: center;
          font-size: 70%;
        }

        .folk > img {
          width: 50px;
          border-radius: 10000px;
        }

        mwc-textfield.rounded {
          --mdc-shape-small: 20px;
          width: 7em;
          margin-top:10px;
        }

        mwc-textfield label {
          padding: 0px;
        }

        @media (min-width: 640px) {
          main {
            max-width: none;
          }
        }
      `,
    ];
  }
}
