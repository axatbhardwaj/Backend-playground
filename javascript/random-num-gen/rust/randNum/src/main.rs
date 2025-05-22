use std::time::SystemTime;

fn get_salt() {
    let mut now: SystemTime = SystemTime::now();
    now = now
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    println!("salt = {:?}", now);
}

fn rand_num() {}

fn main() {
    rand_num();
    get_salt();
}
