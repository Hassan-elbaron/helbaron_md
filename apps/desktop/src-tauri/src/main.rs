#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if helbaron_lib::run_portable_update_helper_if_requested() {
        return;
    }
    helbaron_lib::run();
}
