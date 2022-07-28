pub use error::{AttestationsError, AttestationsResult};

pub use hdk::prelude::Path;
pub use hdk::prelude::*;

pub mod attestation;
pub mod error;
pub mod nonce;
pub mod signals;

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    // grant unrestricted access to accept_cap_claim so other agents can send us claims
    let mut functions = BTreeSet::new();
    functions.insert((zome_info()?.name, "recv_remote_signal".into()));
    functions.insert((zome_info()?.name, "recv_fulfillment".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions,
    })?;
    Ok(InitCallbackResult::Pass)
}
