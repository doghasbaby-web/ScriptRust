struct Resource {
    pub id: &str,
    pub refCount: f64,
}

impl Resource {
    pub fn new(id: &str) -> Self {
        self.id = id;
        println!("{:?} {:?}", "Resource created:", id);
}
    pub fn borrow(&self) -> () {
        self.refCount = self.refCount + 1;
        println!("{:?} {:?} {:?} {:?}", "Resource borrowed:", self.id, "- refs:", self.refCount);
}
    pub fn release(&self) -> () {
        self.refCount = self.refCount - 1;
        println!("{:?} {:?} {:?} {:?}", "Resource released:", self.id, "- refs:", self.refCount);
        if self.refCount == 0 {
            println!("{:?} {:?}", "Resource freed:", self.id);
}
}
    pub fn getId(&self) -> &str {
        self.id
}
}

let resource1 = Resource::new("DB-Connection-1");

let borrowed = resource1;

borrowed.borrow();

println!("{:?} {:?}", "Using resource:", borrowed.getId());

borrowed.release();

resource1.release();

