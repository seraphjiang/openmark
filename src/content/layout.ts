export interface LayoutElements {
  root: HTMLElement;
  left: HTMLElement;
  leftExplorer: HTMLElement;
  leftSplitHandle: HTMLElement;
  leftOutline: HTMLElement;
  leftHandle: HTMLElement;
  center: HTMLElement;
  centerPreview: HTMLElement;
  centerSplitHandle: HTMLElement;
  centerEditor: HTMLElement;
  rightHandle: HTMLElement;
  right: HTMLElement;
  rightToggle: HTMLElement;
  editToggle: HTMLElement;
}

export function createLayout(isLocal: boolean): LayoutElements {
  const root = document.createElement("div");
  root.className = "openmark-layout";

  // Left panel: file explorer (top) + outline (bottom)
  const left = document.createElement("aside");
  left.className = "openmark-panel-left";

  const leftExplorer = document.createElement("div");
  leftExplorer.className = "panel-left-explorer";

  const leftSplitHandle = document.createElement("div");
  leftSplitHandle.className = "openmark-split-handle";

  const leftOutline = document.createElement("div");
  leftOutline.className = "panel-left-outline";

  left.appendChild(leftExplorer);
  left.appendChild(leftSplitHandle);
  left.appendChild(leftOutline);

  const leftHandle = document.createElement("div");
  leftHandle.className = "openmark-resize-handle left";

  // Center panel (preview top + editor bottom)
  const center = document.createElement("main");
  center.className = "openmark-panel-center";

  const centerPreview = document.createElement("div");
  centerPreview.className = "center-preview";

  const centerSplitHandle = document.createElement("div");
  centerSplitHandle.className = "openmark-split-handle horizontal";
  centerSplitHandle.style.display = "none";

  const centerEditor = document.createElement("div");
  centerEditor.className = "center-editor";
  centerEditor.style.display = "none";

  center.appendChild(centerPreview);
  center.appendChild(centerSplitHandle);
  center.appendChild(centerEditor);

  // Right panel: tabbed menu
  const rightHandle = document.createElement("div");
  rightHandle.className = "openmark-resize-handle right";

  const right = document.createElement("aside");
  right.className = "openmark-panel-right";

  // Right toggle button (always visible on right edge)
  const rightToggle = document.createElement("button");
  rightToggle.className = "openmark-right-toggle";
  rightToggle.textContent = "☰";
  rightToggle.title = "Toggle menu panel";

  rightToggle.addEventListener("click", () => {
    const isHidden = right.classList.toggle("collapsed");
    rightHandle.style.display = isHidden ? "none" : "";
  });

  // Edit mode toggle
  const editToggle = document.createElement("button");
  editToggle.className = "openmark-edit-toggle";
  editToggle.textContent = "✎";
  editToggle.title = "Toggle editor";

  editToggle.addEventListener("click", () => {
    const isEditing = centerEditor.style.display !== "none";
    if (isEditing) {
      centerEditor.style.display = "none";
      centerSplitHandle.style.display = "none";
      centerPreview.style.flex = "1";
      editToggle.classList.remove("active");
    } else {
      centerEditor.style.display = "";
      centerSplitHandle.style.display = "";
      centerPreview.style.flex = "";
      editToggle.classList.add("active");
    }
  });

  // Assemble
  if (isLocal) {
    root.appendChild(left);
    root.appendChild(leftHandle);
  }
  root.appendChild(center);
  root.appendChild(rightHandle);
  root.appendChild(right);
  root.appendChild(editToggle);
  root.appendChild(rightToggle);

  // Left split handle: vertical resize between explorer and outline
  if (isLocal) {
    initSplitResize(leftSplitHandle, leftExplorer, leftOutline);
  }

  // Center split: resize between preview and editor
  initSplitResize(centerSplitHandle, centerPreview, centerEditor);

  return { root, left, leftExplorer, leftSplitHandle, leftOutline, leftHandle, center, centerPreview, centerSplitHandle, centerEditor, rightHandle, right, rightToggle, editToggle };
}

function initSplitResize(handle: HTMLElement, top: HTMLElement, _bottom: HTMLElement): void {
  let startY: number;
  let startHeight: number;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    startY = e.clientY;
    startHeight = top.getBoundingClientRect().height;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";

    function onMove(ev: MouseEvent) {
      const delta = ev.clientY - startY;
      const newHeight = Math.max(80, startHeight + delta);
      top.style.height = newHeight + "px";
    }

    function onUp() {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}
