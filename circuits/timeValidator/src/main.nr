// Define the main function for the circuit.
fn main(localStartTime: u64, localEndTime: u64, grade: u64,  blockStartTime: pub u64, blockEndTime: pub u64) {
    assert(localEndTime > localStartTime);
    assert(blockEndTime > blockStartTime);
    let local = localEndTime - localStartTime;
    assert(grade == local);
    let block = blockEndTime - blockStartTime;
    assert(block > local);
}
