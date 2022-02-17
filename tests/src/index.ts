import { Orchestrator } from "@holochain/tryorama";
import attestations from "./attestations";

let orchestrator = new Orchestrator();
attestations(orchestrator);
orchestrator.run();
/*
orchestrator = new Orchestrator()
require('./profile')(orchestrator)
orchestrator.run()
*/
