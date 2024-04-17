import React from 'react'
import { WebContainer } from '@webcontainer/api'
import 'xterm/css/xterm.css'
import { bootVM } from '@/shared/vm'

function App() {
  const [webcontainer, setWebcontainer] = React.useState<WebContainer>()
  const isBooting = React.useRef(false)
  const [src, setSrc] = React.useState('')
  const terminalRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    init()
  }, [])

  const init = async () => {
    if(isBooting.current) return
    isBooting.current = true

    const result = await bootVM({
      terminalEl: terminalRef.current!,
      onSetSrc: (src: string) => setSrc(src)
    })
    if(!result) {
      isBooting.current = false
      return
    } else {
      setWebcontainer(result)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <iframe src={src} style={{ width: '100%', height: '100%', flex: 1 }} />
      <div className="terminal" ref={terminalRef} style={{ flex: 1, background: '#fff' }}></div>
    </div>
  )
}

export default App
