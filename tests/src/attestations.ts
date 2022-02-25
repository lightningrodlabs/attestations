import { Orchestrator, Config, InstallAgentsHapps } from "@holochain/tryorama";
import path from "path";
import * as _ from "lodash";
import {Attestation, AttestationOutput} from "../../ui/lib/src/types"

import {
  RETRY_DELAY,
  RETRY_COUNT,
  localConductorConfig,
  networkedConductorConfig,
  installAgents,
  awaitIntegration,
  delay,
} from "./common";
import { Base64 } from "js-base64";

function serializeHash(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}

function checkAttestations(t, attestationObject: AttestationOutput, attestation: Attestation, hash: string, attesters: Array<string>) {
  t.equal(attestationObject.hash, hash)
  t.deepEqual(attestationObject.content, attestation)
  attestationObject.attesters.forEach((element,i) => {
    t.equal(attesters[i], element.author)
  });
}
export default async (orchestrator) => {
  orchestrator.registerScenario("attestations basic tests", async (s, t) => {
    // Declare two players using the previously specified config, nicknaming them "alice" and "bob"
    // note that the first argument to players is just an array conductor configs that that will
    // be used to spin up the conductor processes which are returned in a matching array.
    const [a_and_b_conductor] = await s.players([localConductorConfig]);

    // install your happs into the conductors and destructuring the returned happ data using the same
    // array structure as you created in your installation array.
    let [alice_attestations_happ, bobbo_attestations_happ] =
      await installAgents(a_and_b_conductor, ["alice", "bobbo"]);
    const [alice_attestations] = alice_attestations_happ.cells;
    const [bobbo_attestations] = bobbo_attestations_happ.cells;
    const boboAgentKey = serializeHash(bobbo_attestations.cellId[1]);
    const aliceAgentKey = serializeHash(alice_attestations.cellId[1]);

    // Create an attestation
    let attestation1 = {
      content: "Bobbo is cool!",
      about: boboAgentKey,
    };

    a_and_b_conductor.setSignalHandler((signal) => {
      console.log("Received Signal:", signal);
      t.deepEqual(signal.data.payload.message, {
        type: "NewAttestation",
        content: attestation1,
      });
    });

    const attestation1_hash = await alice_attestations.call(
      "hc_zome_attestations",
      "create_attestation",
      attestation1
    );
    t.ok(attestation1_hash);
    console.log("attestation1_hash", attestation1_hash);

    let attestations = await alice_attestations.call(
      "hc_zome_attestations",
      "get_my_attestations",
      null
    );
    console.log(attestations);
    checkAttestations(t,attestations[0], attestation1, attestation1_hash, [aliceAgentKey])

    attestations = await alice_attestations.call(
      "hc_zome_attestations",
      "get_attestations",
      {of: boboAgentKey}
    );
    console.log(attestations);
    checkAttestations(t,attestations[0], attestation1, attestation1_hash, [aliceAgentKey])

    attestations = await alice_attestations.call(
      "hc_zome_attestations",
      "get_attestations",
      {by: aliceAgentKey}
    );
    console.log(attestations);
    t.is(attestations.length,1)
    checkAttestations(t,attestations[0], attestation1, attestation1_hash, [aliceAgentKey])

    attestations = await alice_attestations.call(
      "hc_zome_attestations",
      "get_attestations",
      {by: aliceAgentKey,
       of: boboAgentKey}
    );
    console.log(attestations);
    t.is(attestations.length,1)
    checkAttestations(t,attestations[0], attestation1, attestation1_hash, [aliceAgentKey])

    attestations = await alice_attestations.call(
      "hc_zome_attestations",
      "get_attestations",
      {content: "Bobbo is cool!"}
    );
    console.log("Should be bobbo", attestations);
    checkAttestations(t,attestations[0], attestation1, attestation1_hash, [aliceAgentKey])


    attestations = await alice_attestations.call(
      "hc_zome_attestations",
      "get_attestations",
      {agent: aliceAgentKey}
    );
    console.log("Should be nothing", attestations);
    t.deepEqual(attestations, []);

    const attestation2_hash = await bobbo_attestations.call(
      "hc_zome_attestations",
      "create_attestation",
      attestation1
    );
    t.ok(attestation1_hash);
    t.equal(attestation2_hash, attestation1_hash)
    attestations = await bobbo_attestations.call(
      "hc_zome_attestations",
      "get_my_attestations",
    );
    t.equal(attestations[0].attesters.length, 2);

    attestations = await alice_attestations.call(
      "hc_zome_attestations",
      "get_my_attestations",
    );
    t.equal(attestations[0].attesters.length, 2);

    await alice_attestations.call(
      "hc_zome_attestations",
      "handshake",
      {to: boboAgentKey,
       oneTimeKey: "fish"}
    );

  });

};
