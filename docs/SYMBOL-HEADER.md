# Single-line masthead

28 October 2026. Owner requested one line and symbols for navigation. Brand, area selection and five existing destinations remain. Functional SVG symbols represent map, satellite, plan, drill and research; native buttons retain their original accessible names, bilingual title tooltips, keyboard focus and aria-current. SVGs are decorative to assistive technology. The research accessible name is bilingual; other accessible names retain existing English. Emergency1784 remains on desktop and the existing phone emergency treatment is unchanged.

Region labels are shortened in the selector (full region title remains available, and the main area view retains full geography). No map, protocol, personal field or research content is removed. Header switches remain native controls. No external icon library was added.

Real browser measurements at320/360/390/681/800/1024/1440px show46px phone/narrow header and38px desktop header. Every brand/select/nav item is inside the bar and vertically centered on one row; no page-width overflow. All five symbols opened their correct sections and updated aria-current.360px Gulf selection was also inspected. The generic form min-height previously caused the desktop selector to extend1px above the masthead; scoped selector sizing fixes that without reducing the symbol targets below24px.

`design/symbol-header-metrics.json` stores rendered evidence; `symbol-header-result.json` applies the48px/one-row/inside/overflow budgets. The actual archived old390px masthead (`design/research-captures.json`, Thai390case) measured86px, so it fails the same48px budget. Current phone height recovers40px for operating content. Screenshots: `docs/evidence/symbol-header-phone.png`, `symbol-header-360-gulf.png`, `symbol-header-desktop.png`. Final canonical screenshot is appended after deploy.

Independent reviewer checked the phone composition, accessible naming, SVG semantics, target sizes and selected/focus indicators. Final desktop/narrow result and release verification follow below.

Independent final desktop/narrow review passed with no remaining blockers. Parent browser exercised all five destinations; screenshot review covered desktop and360px Gulf selection. Three existing map/task geometry cases at390/1024/1440 also passed unchanged budgets (`design/symbol-header-map.json`).26automated tests passed in the release command; production build/deployment receipt follows.
