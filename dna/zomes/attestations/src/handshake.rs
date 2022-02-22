use hdk::prelude::{serde_bytes::ByteBuf, holo_hash::AgentPubKeyB64};
pub use hdk::prelude::*;

/// Input to the handshake call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HandshakeInput {
    pub to: AgentPubKeyB64,
    pub one_time_key: String,
}

#[hdk_extern]
fn handshake(input: HandshakeInput) -> ExternResult<()> {
    let result = call_remote(
        input.to.into(),
        "hc_zome_attestations".into(),
        "recv_handshake".into(),
        None,
        ExternIO::encode(input.one_time_key)?, //input.one_time_key.to_string(),
    )?;
    if let ZomeCallResponse::Ok(io) = result {
        let decoded_result: u32 = ExternIO::decode(&io)?;
        debug!("got return value {:?}", decoded_result);
        Ok(())
    } else {
        Err(WasmError::Guest(format!("Handshake error: {:?}", result)))
    }
}

fn as_u32_be(array: &ByteBuf) -> u32 {
    ((array[0] as u32) << 24) +
    ((array[1] as u32) << 16) +
    ((array[2] as u32) <<  8) +
    ((array[3] as u32) <<  0)
}

#[hdk_extern]
fn recv_handshake(input: ExternIO) -> ExternResult<u32> {
    let _caller = call_info()?.provenance;
    let payload: String = ExternIO::decode(&input)?;
    debug!("recv_handshake: {}", payload);
    let id_bytes = random_bytes(4)?;
    let id: u32 = as_u32_be(&id_bytes);
    Ok(id)
}

/// returned value from the handshake
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HandshakeResult {
    pub one_time_key: String,
}
