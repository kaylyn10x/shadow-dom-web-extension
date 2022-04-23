export {}

let forceOpen = false

window.addEventListener('ForceOpen', (event) => {
  forceOpen = event.detail.forceOpen
})

type AttachShadowFn = typeof Element.prototype.attachShadow
;(Element.prototype as any)._attachShadow = Element.prototype.attachShadow
Element.prototype.attachShadow = function (
  ...params: Parameters<AttachShadowFn>
): ReturnType<AttachShadowFn> {
  const newParams = params
  if (forceOpen && params?.[0]) {
    newParams[0].mode = 'open'
  }

  const shadowRoot = (this as any)._attachShadow(...newParams)

  // window.dispatchEvent(
  //   new CustomEvent("ShadowAttached", { detail: { shadowRoot } })
  // );

  return shadowRoot
}
