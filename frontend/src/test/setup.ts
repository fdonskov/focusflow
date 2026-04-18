import "@testing-library/jest-dom/vitest";

// PointerEvent методы не реализованы в jsdom, а Radix их использует
if (typeof window !== "undefined" && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
}
