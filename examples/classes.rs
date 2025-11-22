let PI: f64 = 3.14159;

struct Shape {
    pub type: &str,
}

impl Shape {
    pub fn new(type: &str) -> Self {
        self.type = type;
}
    pub fn getType(&self) -> &str {
        self.type
}
}

struct Circle {
    pub radius: f64,
}

impl Circle {
    pub fn new(r: f64) -> Self {
        self.radius = r;
}
    pub fn area(&self) -> f64 {
        PI * self.radius * self.radius
}
    pub fn circumference(&self) -> f64 {
        2 * PI * self.radius
}
}

struct Rectangle {
    pub width: f64,
    pub height: f64,
}

impl Rectangle {
    pub fn new(w: f64, h: f64) -> Self {
        self.width = w;
        self.height = h;
}
    pub fn area(&self) -> f64 {
        self.width * self.height
}
    pub fn perimeter(&self) -> f64 {
        2 * self.width + self.height
}
}

let circle = Circle::new(5);

println!("{:?} {:?}", "Circle - Radius:", circle.radius);

println!("{:?} {:?}", "Circle - Area:", circle.area());

println!("{:?} {:?}", "Circle - Circumference:", circle.circumference());

let rectangle = Rectangle::new(4, 6);

println!("{:?} {:?} {:?} {:?}", "Rectangle - Width:", rectangle.width, "Height:", rectangle.height);

println!("{:?} {:?}", "Rectangle - Area:", rectangle.area());

println!("{:?} {:?}", "Rectangle - Perimeter:", rectangle.perimeter());

