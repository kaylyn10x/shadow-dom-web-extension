import { useEffect, useState } from 'react'
import './App.css'

type Config = {
  forceOpen: boolean
}

function App() {
  const [numShadows, setNumShadows] = useState<number>()
  const [forceOpen, setForceOpen] = useState<boolean>()

  const sendForceOpen = (forceOpen: boolean) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      if (tabs.length > 0) {
        chrome.tabs
          .sendMessage(tabs.shift().id, {
            type: 'forceOpen',
            forceOpen,
          })
          .catch(() => {})
      }
    })
  }

  useEffect(() => {
    chrome.storage.local.get(
      'config',
      (result: { config: Config } | undefined) => {
        const f = result?.config.forceOpen ?? false
        setForceOpen(f)
        sendForceOpen(f)
      },
    )
  }, [])

  const countShadows = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      chrome.tabs.sendMessage(
        tabs.shift().id,
        { type: 'countShadows' },
        (response: any) => {
          setNumShadows(response)
        },
      )
    })
  }

  return (
    <div className="App">
      <p>
        <button type="button" onClick={countShadows}>
          Count Shadow Hosts
        </button>
        {numShadows && <p>Shadow Hosts: {numShadows}</p>}
      </p>
      {forceOpen !== undefined && (
        <p>
          <label htmlFor="force_open">Force open</label>
          <input
            id="force_open"
            type="checkbox"
            checked={forceOpen}
            onChange={() =>
              setForceOpen((f) => {
                chrome.storage.local.set({
                  config: {
                    forceOpen: !f,
                  },
                })
                sendForceOpen(!f)
                return !f
              })
            }
          />
        </p>
      )}
    </div>
  )
}

export default App
