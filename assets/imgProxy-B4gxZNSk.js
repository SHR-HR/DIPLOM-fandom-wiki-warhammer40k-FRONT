import{B as s}from"./index-BOMAx2s1.js";const n="data:image/svg+xml;utf8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'>
      <defs>
        <!-- Темный градиентный фон в стиле Warhammer -->
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#0b0f19'/>
          <stop offset='100%' stop-color='#0a0d14'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <!-- Текст-заглушка с латунным цветом -->
      <text x='50%' y='50%' fill='#b48d57' font-size='22' font-family='system-ui,Segoe UI,Arial,sans-serif' dominant-baseline='middle' text-anchor='middle' opacity='0.85'>
        image unavailable
      </text>
    </svg>`);function u(){try{const r=s.defaults.baseURL||"http://localhost:8000";return new URL(r).origin}catch{return"http://localhost:8000"}}const a=u();function o(r){if(!r)return!1;if(r.startsWith("data:")||r.startsWith("blob:")||r.startsWith("/uploads/")||r.startsWith("/media/")||r.startsWith("./")||r.startsWith("../"))return!0;try{return new URL(r,a).origin===a}catch{return!1}}function l(r){const t=new URL(r.toString());return t.hostname="i.pixiv.cat",t.toString()}function f(r){try{const t=new URL(r);return`https://i0.wp.com/${t.host}${t.pathname}${t.search||""}?ssl=1&strip=all`}catch{return r}}function h(r){const t=(r||"").trim();if(!t)return n;if(o(t))try{return new URL(t,a).toString()}catch{return t}let e;try{e=new URL(t)}catch{return n}const i=e.hostname.toLowerCase();return/(^|\.)pximg\.net$/.test(i)?l(e):e.toString()}function g(r){if(!r||r.startsWith("data:")||r.startsWith("blob:"))return!1;try{const t=new URL(r,window.location.origin);return t.origin===window.location.origin||t.origin===a?!1:t.hostname.toLowerCase()==="i0.wp.com"}catch{return!1}}function d(r){const t=r.currentTarget,e=Number(t.getAttribute("data-fallback-step")||"0"),i=t.getAttribute("data-original")||t.src||"";if(!i){t.src=n,t.setAttribute("data-fallback-step","99");return}if(e===0&&!o(i)){t.src=f(i),t.setAttribute("data-fallback-step","1");return}t.removeAttribute("crossorigin"),t.src=n,t.setAttribute("data-fallback-step","99")}export{n as P,g as n,d as o,h as p};
