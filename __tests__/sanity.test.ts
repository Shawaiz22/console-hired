describe("Sanity Test Suite", () => {
  it("should pass basic truthiness check", () => {
    expect(true).toBe(true);
  });

  it("should calculate basic arithmetic correctly", () => {
    const sum = (a: number, b: number) => a + b;
    expect(sum(2, 3)).toBe(5);
  });
});
