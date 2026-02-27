import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import obfuscator from 'rollup-plugin-javascript-obfuscator'

export default defineConfig({
    plugins: [
        react(),
        {
            ...obfuscator({
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                numbersToExpressions: true,
                simplify: true,
                stringArray: true,
                stringArrayThreshold: 0.75,
                splitStrings: true,
                splitStringsChunkLength: 10,
                unicodeEscapeSequence: false
            }),
            apply: 'build' // Only obfuscate during npm run build
        }
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            }
        }
    }
})
