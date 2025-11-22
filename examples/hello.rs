fn main() {
    let message: String = "Hello, ScriptRust!";

    fn greet(name: String) -> String {
        format!("Hello, {}!", name)
}

    println!("{:?}", message);

    println!("{:?}", greet("World"));

    println!("{:?}", greet("Developer"));

}
