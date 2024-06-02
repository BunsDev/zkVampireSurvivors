// Define the main function for the circuit.
fn main(id: Field, glod: u64, diamond: u64, itemId: pub Field, glodNumber: pub u64, diamondNumber: pub u64) {
    assert(id == itemId);
    assert(glod <= glodNumber);
    assert(diamond <= diamondNumber);
}
