# Mermaid Diagrams Test

## Flowchart

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Check console]
    E --> B
    C --> F[Ship it]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant E as Extension
    participant R as Renderer

    U->>B: Open .md file
    B->>E: Content script injected
    E->>R: Parse markdown
    R-->>E: HTML output
    E->>B: Replace DOM
    B-->>U: Rendered document
```

## Gantt Chart

```mermaid
gantt
    title OpenMark Development
    dateFormat YYYY-MM-DD
    section Core
        Markdown parsing     :done, 2025-01-01, 30d
        Syntax highlighting  :done, 2025-01-15, 20d
        Mermaid support      :done, 2025-02-01, 14d
    section Polish
        Dark theme           :done, 2025-02-15, 7d
        Auto refresh         :done, 2025-02-20, 5d
        Security fixes       :active, 2025-03-01, 10d
```

## Class Diagram

```mermaid
classDiagram
    class Settings {
        +string theme
        +number fontSize
        +number lineHeight
        +boolean showToc
        +boolean enableMermaid
    }
    class Renderer {
        +initRenderer(settings)
        +renderMarkdown(source)
        +renderMermaidDiagrams()
    }
    class Background {
        +onInstalled()
        +onMessage()
        +fetchFile(url)
    }
    Settings --> Renderer : configures
    Background --> Renderer : proxies files for
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Detecting : Page loaded
    Detecting --> Rendering : Is markdown
    Detecting --> Idle : Not markdown
    Rendering --> Displayed : Success
    Rendering --> Error : Failed
    Displayed --> Refreshing : File changed
    Refreshing --> Displayed : Re-render
    Error --> [*]
```

## Pie Chart

```mermaid
pie title Bundle Size Breakdown
    "highlight.js" : 400
    "KaTeX" : 500
    "markdown-it" : 100
    "OpenMark core" : 50
```
