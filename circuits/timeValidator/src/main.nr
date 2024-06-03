// Define the main function for the circuit.
fn main(localStartTime: u64, localEndTime: u64, grade: pub u64) {
    assert(localEndTime > localStartTime);
    let local = localEndTime - localStartTime;
    assert(grade <= local);
}
