/* eslint-disable */
import shadowInject from './inject-shadow-listener?script&module'

const getShadowHosts = (root: Node) => {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    (node) =>
      // (node as any).shadowRoot
      chrome.dom.openOrClosedShadowRoot(node)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP,
  )

  let shadowHosts: Node[] = []
  const addHost = (node: Node) => {
    shadowHosts = [
      ...shadowHosts,
      node,
      // ...getShadowHosts((node as any).shadowRoot),
      ...getShadowHosts(chrome.dom.openOrClosedShadowRoot(node)),
    ]
  }

  if (root instanceof Element && chrome.dom.openOrClosedShadowRoot(root)) {
    addHost(root)
  }

  while (treeWalker.nextNode()) {
    addHost(treeWalker.currentNode)
  }

  return shadowHosts
}

// TODO: Optimize to not have to walk entire tree every mutation
let shadowMutationObserver: MutationObserver | null = null
const mutationSettings: MutationObserverInit = {
  childList: true,
  subtree: true,
}

const attachObserver = (observer: MutationObserver) => {
  const shadowHosts = getShadowHosts(document.body)
  observer.observe(document.body, mutationSettings)
  for (const shadowHost of shadowHosts) {
    observer.observe(
      chrome.dom.openOrClosedShadowRoot(shadowHost),
      mutationSettings,
    )
  }
}

const handleMutations = (
  mutations: MutationRecord[],
  observer: MutationObserver,
) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      observer.disconnect()
      attachObserver(observer)
    }
  }
}

shadowMutationObserver = new MutationObserver(handleMutations)
attachObserver(shadowMutationObserver)

// window.addEventListener(
//   "ShadowAttached",
//   (event) => {
//     console.log("shadow attached");
//   },
//   false
// );

const injectedScript = document.createElement('script')
injectedScript.src = chrome.runtime.getURL(shadowInject)
injectedScript.type = 'module'
document.head.prepend(injectedScript)

chrome.runtime.onMessage.addListener(
  (message: any, sender: any, sendResponse: any) => {
    switch (message.type) {
      case 'countShadows':
        const shadows = getShadowHosts(document.body)
        console.log(shadows)
        sendResponse(shadows.length)
        break
      case 'forceOpen':
        window.dispatchEvent(
          new CustomEvent('ForceOpen', {
            detail: { forceOpen: message.forceOpen },
          }),
        )
    }
  },
)
