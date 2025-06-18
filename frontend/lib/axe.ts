export const initializeAxe = async () => {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const axe = await import("react-axe");
    const React = await import("react");
    const ReactDOM = await import("react-dom");

    axe.default(React, ReactDOM, 1000);
  }
};
