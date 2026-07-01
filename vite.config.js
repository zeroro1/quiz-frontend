import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import fs from 'node:fs'
import path from 'node:path'

const distDir = path.join(process.cwd(), 'unpackage', 'dist', 'dev', 'mp-weixin')

export default defineConfig({
  plugins: [
    uni(),
    {
      name: 'wechat-game-transform',
      async writeBundle() {
        if (!fs.existsSync(distDir)) {
          console.log('[transform] dist not ready')
          return
        }

        // 1. 复制 game.json 到编译输出
        const gameJsonSrc = path.join(process.cwd(), 'game.json')
        const gameJsonDst = path.join(distDir, 'game.json')
        if (fs.existsSync(gameJsonSrc)) {
          fs.copyFileSync(gameJsonSrc, gameJsonDst)
          console.log('[transform] game.json copied')
        }

        // 2. 修改 project.config.json
        const pcPath = path.join(distDir, 'project.config.json')
        if (fs.existsSync(pcPath)) {
          const cfg = JSON.parse(fs.readFileSync(pcPath, 'utf-8'))
          cfg.compileType = 'game'
          fs.writeFileSync(pcPath, JSON.stringify(cfg, null, 2), 'utf-8')
          console.log('[transform] compileType set to game')
        }

        // 3. 删除 app.json（让微信开发者工具不以小程序模式加载）
        const appJsonPath = path.join(distDir, 'app.json')
        if (fs.existsSync(appJsonPath)) {
          fs.unlinkSync(appJsonPath)
          console.log('[transform] app.json removed')
        }

        // 4. wxss -> css
        function walk(dir) {
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const e of entries) {
            const fp = path.join(dir, e.name)
            if (e.isDirectory()) walk(fp)
            else if (e.name.endsWith('.wxss')) {
              fs.renameSync(fp, fp.replace(/\.wxss$/, '.css'))
            }
          }
        }
        walk(distDir)
        console.log('[transform] ALL DONE')
      }
    }
  ]
})