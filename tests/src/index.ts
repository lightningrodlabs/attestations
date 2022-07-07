import { ActionHash, DnaSource } from "@holochain/client";
import { pause, runScenario, Scenario  } from "@holochain/tryorama";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dnaPath = path.join(__dirname, "../../dna/workdir/dna/attestations.dna")

import * as _ from "lodash";
import {Attestation, AttestationOutput} from "../../ui/lib/src/types"
import test from "tape-promise/tape.js";
import {EntryHashB64, AgentPubKeyB64} from "@holochain-open-dev/core-types";

import { Base64 } from "js-base64";
import { delay } from "lodash";

function serializeHash(hash: Uint8Array): AgentPubKeyB64 {
  return `u${Base64.fromUint8Array(hash, true)}`;
}

function checkAttestations(t, attestationObject: AttestationOutput, attestation: Attestation, hash: EntryHashB64, attesters: Array<AgentPubKeyB64>) {
  t.equal(attestationObject.hash, hash)
  t.deepEqual(attestationObject.content, attestation)
  attestationObject.attesters.forEach((element,i) => {
    t.equal(attesters[i], element.author)
  });
}

test("attestations basic tests", async (t) => {
  await runScenario(async (scenario: Scenario) => {


    const dnas: DnaSource[] = [{ path: dnaPath }];
    const [alice, bobbo] = await scenario.addPlayersWithHapps([dnas, dnas]);
    await scenario.shareAllAgents();


    const [alice_attestations] = alice.cells;
    const [bobbo_attestations] = bobbo.cells;
    const boboAgentKey = serializeHash(bobbo.agentPubKey);
    const aliceAgentKey = serializeHash(alice.agentPubKey);

    // Create an attestation
    let attestation1 = {
      content: "Cool Person",
      about: boboAgentKey,
    };

    const attestation1_hash: EntryHashB64 = await alice_attestations.callZome( {
      zome_name: "hc_zome_attestations",
      fn_name: "create_attestation",
      payload: attestation1
    }
    );
    t.ok(attestation1_hash);
    console.log("attestation1_hash", attestation1_hash);

    let attestations : Array<AttestationOutput> = await alice_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "get_my_attestations",
      payload: null
    });
    console.log(attestations);
    checkAttestations(t, attestations[0], attestation1, attestation1_hash, [aliceAgentKey])

    attestations = await alice_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "get_attestations",
      payload: {of: boboAgentKey}
    });
    console.log(attestations);
    checkAttestations(t,attestations[0], attestation1, attestation1_hash, [aliceAgentKey])

    attestations = await alice_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "get_attestations",
      payload: {by: aliceAgentKey}
    });
    console.log(attestations);
    t.is(attestations.length,1)
    checkAttestations(t,attestations[0], attestation1, attestation1_hash, [aliceAgentKey])

    attestations = await alice_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "get_attestations",
      payload: {by: aliceAgentKey,
       of: boboAgentKey}}
    );
    console.log(attestations);
    t.is(attestations.length,1)
    checkAttestations(t,attestations[0], attestation1, attestation1_hash, [aliceAgentKey])

    attestations = await alice_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "get_attestations",
      payload: {content: "Cool Person"}
    });
    console.log("Should be bobbo", attestations);
    checkAttestations(t,attestations[0], attestation1, attestation1_hash, [aliceAgentKey])


    attestations = await alice_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "get_attestations",
      payload: {agent: aliceAgentKey}
    });
    console.log("Should be nothing", attestations);
    t.deepEqual(attestations, []);

    const attestation2_hash = await bobbo_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "create_attestation",
      payload: attestation1
    });
    t.ok(attestation1_hash);
    t.equal(attestation2_hash, attestation1_hash)
    attestations = await bobbo_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "get_my_attestations",}
    );
    t.equal(attestations[0].attesters.length, 2);
    await pause(500)
    attestations = await alice_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "get_my_attestations",}
    );
    t.equal(attestations[0].attesters.length, 2);

    // now have bobbo say Alice is a cool person
    const attestation2 = {
      content: "Cool Person",
      about: aliceAgentKey,
    };
    const attestation3_hash = await bobbo_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "create_attestation",
      payload: attestation2
    });

    t.ok(attestation3_hash);
    console.log("attestation3_hash", attestation1_hash);

    attestations = await bobbo_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "get_attestations",
      payload: //{content: "Cool Person"}
      {by: boboAgentKey,
       of: boboAgentKey
      }}
    );
    t.equal(attestations.length,2)

    let nonce = await alice_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "create_nonce",
      payload: {with: boboAgentKey, note: "bobbo"},
    });
    console.log("nonce:", nonce)
/*
    a_and_b_conductor.setSignalHandler((signal) => {
      console.log("Received Signal:", signal);
      t.deepEqual(signal.data.payload, {
        nonce: `${nonce}`,
        from: boboAgentKey
      });
    });

    let result = await bobbo_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "fulfill_nonce",
      payload: {with: aliceAgentKey,
       nonce},
      });
    console.log("result:", result)
    attestations = await bobbo_attestations.callZome({
      zome_name: "hc_zome_attestations",
      fn_name: "get_attestations",
      payload: {by: boboAgentKey}
    });
    console.log(attestations);
    t.is(attestations.length,3)
*/
  });
});
