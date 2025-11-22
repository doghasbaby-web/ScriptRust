// Class-based Programming with Decorations

/* xxx, immutable: mathematical constant */
const PI: number = 3.14159;

class Shape {
  /* xxx, immutable: shape type */
  type: string;

  constructor(type: string) {
    this.type = type;
  }

  /* xxx, pure: no side effects */
  getType(): string {
    return this.type;
  }
}

class Circle {
  /* xxx, immutable: radius value */
  radius: number;

  constructor(/* xxx, immutable: r */ r: number) {
    this.radius = r;
  }

  /* xxx, pure: mathematical calculation */
  area(): number {
    return PI * this.radius * this.radius;
  }

  /* xxx, pure: mathematical calculation */
  circumference(): number {
    return 2 * PI * this.radius;
  }
}

class Rectangle {
  /* xxx, immutable: width */
  width: number;

  /* xxx, immutable: height */
  height: number;

  constructor(/* xxx, immutable: w */ w: number, /* xxx, immutable: h */ h: number) {
    this.width = w;
    this.height = h;
  }

  /* xxx, pure: mathematical calculation */
  area(): number {
    return this.width * this.height;
  }

  /* xxx, pure: mathematical calculation */
  perimeter(): number {
    return 2 * (this.width + this.height);
  }
}

// Usage
const circle = new Circle(5);
console.log("Circle - Radius:", circle.radius);
console.log("Circle - Area:", circle.area());
console.log("Circle - Circumference:", circle.circumference());

const rectangle = new Rectangle(4, 6);
console.log("Rectangle - Width:", rectangle.width, "Height:", rectangle.height);
console.log("Rectangle - Area:", rectangle.area());
console.log("Rectangle - Perimeter:", rectangle.perimeter());
