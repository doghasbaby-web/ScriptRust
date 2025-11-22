let message: &str = "Hello, ScriptRust!";

fn greet(name: &str) -> &str {
    "Hello, " + name + "!"
}

println!("{:?}", message);

println!("{:?}", greet("World"));

println!("{:?}", greet("Developer"));

