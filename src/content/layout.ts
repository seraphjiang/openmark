export interface LayoutElements {
  root: HTMLElement;
  left: HTMLElement;
  leftHandle: HTMLElement;
  center: HTMLElement;
  rightHandle: HTMLElement;
  right: HTMLElement;
  flyoutTrigger: HTMLElement;
  flyout: HTMLElement;
}

export function createLayout(isLocal: boolean): LayoutElements {
  const root = document.createElement("div");
  root.className = "openmark-layout";

  const left = document.createElement("aside");
  left.className = "openmark-panel-left";

  const leftHandle = document.createElement("div");
  leftHandle.className = "openmark-resize-handle left";

  const center = document.createElement("main");
  center.className = "openmark-panel-center";

  const rightHandle = document.createElement("div");
  rightHandle.className = "openmark-resize-handle right";

  const right = document.createElement("aside");
  right.className = "openmark-panel-right";

  const flyoutTrigger = document.createElement("button");
  flyoutTrigger.className = "openmark-flyout-trigger";
  flyoutTrigger.textContent = "Menu";
  flyoutTrigger.title = "Open menu";

  const flyout = document.createElement("aside");
  flyout.className = "openmark-flyout";

  root.appendChild(left);
  root.appendChild(leftHandle);
  root.appendChild(center);

  if (isLocal) {
    root.appendChild(rightHandle);
    root.appendChild(right);
  }

  root.appendChild(flyoutTrigger);
  root.appendChild(flyout);

  flyoutTrigger.addEventListener("click", () => {
    flyout.classList.toggle("open");
  });

  return { root, left, leftHandle, center, rightHandle, right, flyoutTrigger, flyout };
}
