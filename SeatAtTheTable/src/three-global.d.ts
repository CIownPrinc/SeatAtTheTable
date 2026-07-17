// LEGAL: three.js r128 is loaded as a browser global via a CDN <script> tag in
// LEGAL: index.html, not imported as a module. This ambient declaration tells the
// LEGAL: type-checker the global exists.
// TODO: replace `any` with @types/three once the 3D map code is split out and typed.
declare const THREE: any;
