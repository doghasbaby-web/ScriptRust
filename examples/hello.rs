let message: String = "Hello, ScriptRust!";

fn greet(name: String) -> String {
    format!("{}{}", format!("{}{}", "Hello, ", name), "!")
}

println!("{:?}", message);

println!("{:?}", greet("World"));

println!("{:?}", greet("Developer"));

