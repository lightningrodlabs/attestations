import { Orchestrator, Config, InstallAgentsHapps } from "@holochain/tryorama";
import path from "path";
import * as _ from "lodash";
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
    t.deepEqual(attestations, [
      { hash: attestation1_hash, content: attestation1, attesters: [aliceAgentKey] },
    ]);

    attestations = await alice_attestations.call(
      "hc_zome_attestations",
      "get_attestations",
      {agent: boboAgentKey}
    );
    console.log(attestations);
    t.deepEqual(attestations, [
      { hash: attestation1_hash, content: attestation1, attesters: [aliceAgentKey] },
    ]);

    attestations = await alice_attestations.call(
      "hc_zome_attestations",
      "get_attestations",
      {content: "Bobbo is cool!"}
    );
    console.log("Should be bobbo", attestations);
    t.deepEqual(attestations, [
      { hash: attestation1_hash, content: attestation1, attesters: [aliceAgentKey] },
    ]);

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

  });

};
